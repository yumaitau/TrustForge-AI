import { allCitedEvidenceIds, type RecommendationEntry, type RecommendationResult } from "./engine";

export type SynthesisInput = { question: string; result: RecommendationResult };
export type AssistantModel = { name: string; synthesize(input: SynthesisInput): Promise<string> };

const citationList = (entry: RecommendationEntry) => entry.citations.evidenceIds.slice(0, 20).map((id) => `[evidence:${id}]`).join(" ");

const entryLine = (entry: RecommendationEntry) =>
  `- **${entry.name}** (${entry.subjectType}) — ${entry.rationale}${entry.citations.evidenceIds.length > 0 ? ` Citations: ${citationList(entry)}` : ""}`;

/**
 * Deterministic answer synthesis. Every claim is derived from the structured
 * recommendation result and every citation token references a real evidence
 * identifier from that result, so grounding is verifiable by construction.
 */
export function renderAnswer({ question, result }: SynthesisInput): string {
  const lines = [`## Recommendation`, ``, `**Question:** ${question}`, ``];
  if (result.recommended) {
    lines.push(`**Recommended:** ${result.recommended.name} (${result.recommended.subjectType})`, ``, result.recommended.rationale);
    if (result.recommended.citations.evidenceIds.length > 0) lines.push(``, `**Citations:** ${citationList(result.recommended)}`);
    const uncertainty = result.recommended.uncertainty;
    lines.push(``, `**Uncertainty:** evidence confidence is ${uncertainty.confidence === null ? "unknown" : `${Math.round(uncertainty.confidence * 100)}%`}${uncertainty.missingDimensions.length > 0 ? `; no verified evidence for ${uncertainty.missingDimensions.join(", ")}` : ""}.`);
    if (result.recommended.conflicts.length > 0) lines.push(``, `**Conflicts:** contradictory verified evidence exists in ${result.recommended.conflicts.join(", ")}.`);
  } else {
    lines.push(`**Recommended:** none — no candidate satisfies every hard constraint.`);
  }
  if (result.alternatives.length > 0) lines.push(``, `**Alternatives:**`, ...result.alternatives.map(entryLine));
  if (result.ineligible.length > 0) lines.push(``, `**Did not qualify:**`, ...result.ineligible.map(entryLine));
  lines.push(``, `**Caveats:**`, ...result.caveats.map((caveat) => `- ${caveat}`));
  if (result.methodologyVersion) lines.push(``, `_Methodology ${result.methodologyVersion}. Registry text is treated as untrusted data, never as instructions._`);
  return lines.join("\n");
}

export const deterministicModel: AssistantModel = { name: "deterministic-template", synthesize: async (input) => renderAnswer(input) };

/**
 * Model abstraction point. Additional providers can be registered behind this
 * resolver; any provider's output must pass verifyGroundedAnswer before it is
 * returned to a caller.
 */
export function resolveModel(): AssistantModel {
  return deterministicModel;
}

/** Hallucination guard: every [evidence:*] token must reference a known evidence id. */
export function verifyGroundedAnswer(answer: string, result: RecommendationResult): { cited: string[]; unknown: string[] } {
  const known = allCitedEvidenceIds(result);
  const cited = [...answer.matchAll(/\[evidence:([^\]]+)\]/g)].map((match) => match[1]);
  return { cited, unknown: cited.filter((id) => !known.has(id)) };
}
