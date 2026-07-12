import { and, eq } from "drizzle-orm";
import { evidence } from "@/db/schema";
import { db } from "@/lib/db/client";
import { getCompany, getProduct, listCompanies, listProducts } from "@/lib/registry/repository";
import { listFindings } from "@/lib/security/intelligence";
import { calculateTrustScore } from "@/lib/trust/methodology";
import { recommend, recommendationRequestSchema, type RecommendationCandidate, type SubjectType } from "./engine";
import { renderAnswer, resolveModel, verifyGroundedAnswer } from "./synthesis";

const OPEN_FINDING_EXCLUSIONS = ["resolved", "not_affected", "false_positive"];

async function buildCandidate(ref: { subjectType: SubjectType; subjectId: string; name: string; verificationLevel?: string | null }): Promise<RecommendationCandidate> {
  const [records, findings] = await Promise.all([
    db.select().from(evidence).where(and(eq(evidence.subjectType, ref.subjectType), eq(evidence.subjectId, ref.subjectId), eq(evidence.status, "verified"))),
    listFindings(ref.subjectType, ref.subjectId),
  ]);
  return {
    ...ref,
    trust: records.length === 0 ? null : calculateTrustScore(records.map((item) => ({
      evidenceId: item.id, dimension: item.dimension, value: Number(item.value), confidence: Number(item.confidence),
      rationale: item.summary ?? item.title, observedAt: item.observedAt, validUntil: item.validUntil, status: item.status,
    }))),
    openFindings: findings.filter((finding) => !OPEN_FINDING_EXCLUSIONS.includes(finding.status)).map((finding) => ({ id: finding.id, severity: finding.severity, status: finding.status })),
  };
}

async function resolveCandidateRefs(input: { subjectType: SubjectType; query?: string; question: string; candidates?: { subjectType: SubjectType; subjectId: string }[]; limit: number }) {
  if (input.candidates?.length) {
    const resolved = await Promise.all(input.candidates.map(async (candidate) => {
      const record = candidate.subjectType === "company" ? await getCompany(candidate.subjectId) : await getProduct(candidate.subjectId);
      if (!record) return null;
      return { subjectType: candidate.subjectType, subjectId: record.id, name: "displayName" in record ? record.displayName : record.name, verificationLevel: record.verificationLevel };
    }));
    return resolved.filter((ref): ref is NonNullable<typeof ref> => ref !== null);
  }
  const query = input.query;
  if (input.subjectType === "company") {
    const { items } = await listCompanies({ query, limit: input.limit * 3 });
    return items.map((item) => ({ subjectType: "company" as const, subjectId: item.id, name: item.displayName, verificationLevel: item.verificationLevel }));
  }
  const { items } = await listProducts({ query, type: input.subjectType === "product" ? undefined : input.subjectType, limit: input.limit * 3 });
  return items.map((item) => ({ subjectType: item.type as SubjectType, subjectId: item.id, name: item.name, verificationLevel: item.verificationLevel }));
}

/**
 * Answers a natural-language trust question. Retrieval and hard constraints
 * are deterministic; the model layer only renders the structured result and
 * its output is rejected if it cites evidence that does not exist.
 */
export async function recommendForQuestion(input: unknown) {
  const parsed = recommendationRequestSchema.parse(input);
  const refs = await resolveCandidateRefs(parsed);
  const candidates = await Promise.all(refs.map(buildCandidate));
  const result = recommend({ question: parsed.question, constraints: parsed.constraints, limit: parsed.limit }, candidates);
  const model = resolveModel();
  let answer = await model.synthesize({ question: result.question, result });
  let grounding = verifyGroundedAnswer(answer, result);
  if (grounding.unknown.length > 0) {
    answer = renderAnswer({ question: result.question, result });
    grounding = verifyGroundedAnswer(answer, result);
  }
  return { result, answer, model: model.name, grounding };
}
