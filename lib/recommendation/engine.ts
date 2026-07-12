import { z } from "zod";
import { TRUST_DIMENSIONS, type TrustDimension, type TrustScoreResult } from "@/lib/trust/methodology";

export const SUBJECT_TYPES = ["company", "product", "mcp_server", "skill", "agent", "model", "api"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export const constraintSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("min_score"), value: z.number().min(0).max(100) }),
  z.object({ kind: z.literal("min_confidence"), value: z.number().min(0).max(1) }),
  z.object({ kind: z.literal("min_dimension_score"), dimension: z.enum(TRUST_DIMENSIONS), value: z.number().min(0).max(100) }),
  z.object({ kind: z.literal("no_open_critical_findings") }),
  z.object({ kind: z.literal("verified_subject") }),
]);
export type HardConstraint = z.infer<typeof constraintSchema>;

export const recommendationRequestSchema = z.object({
  question: z.string().min(5).max(2000),
  subjectType: z.enum(SUBJECT_TYPES).default("product"),
  query: z.string().max(200).optional(),
  candidates: z.array(z.object({ subjectType: z.enum(SUBJECT_TYPES), subjectId: z.uuid() })).max(20).optional(),
  constraints: z.array(constraintSchema).max(20).default([]),
  limit: z.number().int().min(1).max(10).default(5),
});
export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;

/** Maps the flat filter style used by MCP tool inputs onto hard constraints. */
export function constraintsFromFilters(filters: { minTrustScore?: number; minConfidence?: number; requireVerified?: boolean; excludeOpenCriticalFindings?: boolean; minDimensionScores?: { dimension: TrustDimension; value: number }[] }): HardConstraint[] {
  const constraints: HardConstraint[] = [];
  if (filters.minTrustScore !== undefined) constraints.push({ kind: "min_score", value: filters.minTrustScore });
  if (filters.minConfidence !== undefined) constraints.push({ kind: "min_confidence", value: filters.minConfidence });
  if (filters.requireVerified) constraints.push({ kind: "verified_subject" });
  if (filters.excludeOpenCriticalFindings) constraints.push({ kind: "no_open_critical_findings" });
  for (const item of filters.minDimensionScores ?? []) constraints.push({ kind: "min_dimension_score", dimension: item.dimension, value: item.value });
  return constraints;
}

export type RecommendationCandidate = {
  subjectType: SubjectType;
  subjectId: string;
  name: string;
  verificationLevel?: string | null;
  trust: TrustScoreResult | null;
  openFindings?: { id: string; severity: string; status: string }[];
};

export type ConstraintEvaluation = { constraint: HardConstraint; passed: boolean; reason: string };

export type RecommendationEntry = {
  subjectType: SubjectType;
  subjectId: string;
  name: string;
  eligible: boolean;
  score: number | null;
  confidence: number | null;
  constraints: ConstraintEvaluation[];
  citations: { evidenceIds: string[] };
  uncertainty: { confidence: number | null; missingDimensions: TrustDimension[] };
  conflicts: TrustDimension[];
  rationale: string;
};

export type RecommendationResult = {
  methodologyVersion: string | null;
  question: string;
  recommended: RecommendationEntry | null;
  alternatives: RecommendationEntry[];
  ineligible: RecommendationEntry[];
  caveats: string[];
};

/** Marker emitted by lib/trust/methodology.ts when evidence within a dimension materially disagrees. */
const CONFLICT_MARKER = "Materially contradictory evidence is present.";

const INJECTION_PATTERNS = [
  /(ignore|disregard|forget|override)\s+(all\s+|any\s+)?(previous|prior|earlier|above|preceding|system)\s+(instructions?|prompts?|rules?|messages?)/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now\b/gi,
  /\bdo\s+anything\s+now\b/gi,
  /<\|[^|]*\|>/g,
  /\bbegin\s+(system|admin|developer)\b/gi,
];

/**
 * Registry and evidence text is untrusted data, never instructions. Control
 * characters are stripped, instruction-like fragments are redacted, and the
 * result is length-bounded so it can be embedded in synthesized answers.
 */
export function sanitizeUntrustedText(text: string, maxLength = 300): string {
   
  let clean = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  for (const pattern of INJECTION_PATTERNS) clean = clean.replace(pattern, "[redacted: instruction-like text]");
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean;
}

function evaluateConstraint(constraint: HardConstraint, candidate: RecommendationCandidate): ConstraintEvaluation {
  const trust = candidate.trust;
  switch (constraint.kind) {
    case "min_score": {
      if (!trust) return { constraint, passed: false, reason: "No trust score is available." };
      const passed = trust.score >= constraint.value;
      return { constraint, passed, reason: passed ? `Score ${trust.score} meets the minimum of ${constraint.value}.` : `Score ${trust.score} is below the minimum of ${constraint.value}.` };
    }
    case "min_confidence": {
      if (!trust) return { constraint, passed: false, reason: "No trust score is available." };
      const passed = trust.confidence >= constraint.value;
      return { constraint, passed, reason: passed ? `Confidence ${trust.confidence} meets the minimum of ${constraint.value}.` : `Confidence ${trust.confidence} is below the minimum of ${constraint.value}.` };
    }
    case "min_dimension_score": {
      const component = trust?.components.find((item) => item.dimension === constraint.dimension);
      if (!component) return { constraint, passed: false, reason: `No ${constraint.dimension} component is available.` };
      if (component.evidenceIds.length === 0) return { constraint, passed: false, reason: `The ${constraint.dimension} dimension has no verified evidence, so the hard constraint cannot be satisfied.` };
      const passed = component.score >= constraint.value;
      return { constraint, passed, reason: passed ? `${constraint.dimension} score ${component.score} meets the minimum of ${constraint.value}.` : `${constraint.dimension} score ${component.score} is below the minimum of ${constraint.value}.` };
    }
    case "no_open_critical_findings": {
      const open = (candidate.openFindings ?? []).filter((finding) => finding.severity === "critical");
      return open.length === 0
        ? { constraint, passed: true, reason: "No open critical security findings." }
        : { constraint, passed: false, reason: `${open.length} open critical security finding(s): ${open.map((finding) => finding.id).join(", ")}.` };
    }
    case "verified_subject": {
      const passed = Boolean(candidate.verificationLevel && candidate.verificationLevel !== "unverified");
      return { constraint, passed, reason: passed ? `Verification level is ${candidate.verificationLevel}.` : "Subject is unverified." };
    }
  }
}

function toEntry(candidate: RecommendationCandidate, constraints: HardConstraint[]): RecommendationEntry {
  const evaluations = constraints.map((constraint) => evaluateConstraint(constraint, candidate));
  const trust = candidate.trust;
  const missing = trust ? trust.components.filter((component) => component.evidenceIds.length === 0).map((component) => component.dimension) : [...TRUST_DIMENSIONS];
  const conflicts = trust ? trust.components.filter((component) => component.rationale.includes(CONFLICT_MARKER)).map((component) => component.dimension) : [];
  const eligible = evaluations.every((evaluation) => evaluation.passed);
  const failed = evaluations.filter((evaluation) => !evaluation.passed);
  return {
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    name: sanitizeUntrustedText(candidate.name, 160),
    eligible,
    score: trust?.score ?? null,
    confidence: trust?.confidence ?? null,
    constraints: evaluations,
    citations: { evidenceIds: trust ? [...new Set(trust.components.flatMap((component) => component.evidenceIds))] : [] },
    uncertainty: { confidence: trust?.confidence ?? null, missingDimensions: missing },
    conflicts,
    rationale: trust
      ? `Score ${trust.score}/100 with ${Math.round(trust.confidence * 100)}% confidence under methodology ${trust.methodologyVersion}. ${eligible ? `Passed all ${evaluations.length} hard constraint(s).` : `Failed ${failed.length} hard constraint(s): ${failed.map((evaluation) => evaluation.reason).join(" ")}`}${missing.length > 0 ? ` Missing evidence for: ${missing.join(", ")}.` : ""}${conflicts.length > 0 ? ` Contradictory evidence in: ${conflicts.join(", ")}.` : ""}`
      : "No trust score has been calculated for this subject.",
  };
}

/**
 * Deterministic recommendation core. Hard constraints are evaluated in code,
 * never delegated to a model. Ranking is by score, then confidence, then
 * subject id so results are stable and reproducible.
 */
export function recommend(request: { question: string; constraints: HardConstraint[]; limit?: number }, candidates: readonly RecommendationCandidate[]): RecommendationResult {
  const limit = Math.min(Math.max(request.limit ?? 5, 1), 10);
  const entries = candidates.map((candidate) => toEntry(candidate, request.constraints));
  const eligible = entries.filter((entry) => entry.eligible).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || (b.confidence ?? -1) - (a.confidence ?? -1) || a.subjectId.localeCompare(b.subjectId));
  const ineligible = entries.filter((entry) => !entry.eligible);
  const caveats = [
    "A trust score is an evidence-weighted signal, not a certification.",
    "Hard constraints were evaluated deterministically against current verified evidence.",
  ];
  if (eligible.length === 0 && candidates.length > 0) caveats.push("No candidate satisfies every hard constraint; review the ineligible list and constraint reasons.");
  if (candidates.length === 0) caveats.push("No candidates were found for this question.");
  if (eligible[0] && (eligible[0].confidence ?? 0) < 0.3) caveats.push("The recommended subject has low evidence confidence; treat this recommendation as provisional.");
  return {
    methodologyVersion: candidates.find((candidate) => candidate.trust)?.trust?.methodologyVersion ?? null,
    question: sanitizeUntrustedText(request.question, 500),
    recommended: eligible[0] ?? null,
    alternatives: eligible.slice(1, limit),
    ineligible,
    caveats,
  };
}

export function allCitedEvidenceIds(result: RecommendationResult): Set<string> {
  const entries = [result.recommended, ...result.alternatives, ...result.ineligible].filter((entry): entry is RecommendationEntry => entry !== null);
  return new Set(entries.flatMap((entry) => entry.citations.evidenceIds));
}
