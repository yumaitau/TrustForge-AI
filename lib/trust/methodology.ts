export const TRUST_METHODOLOGY_VERSION = "2026.1";

export const TRUST_DIMENSIONS = [
  "security", "privacy", "transparency", "documentation", "maintenance", "support",
  "responsible_ai", "community", "popularity", "incident_history", "update_cadence",
  "open_source_health", "dependency_risk", "vulnerability_history",
] as const;

export type TrustDimension = (typeof TRUST_DIMENSIONS)[number];

export const DEFAULT_WEIGHTS: Readonly<Record<TrustDimension, number>> = {
  security: 0.15,
  privacy: 0.12,
  transparency: 0.10,
  documentation: 0.07,
  maintenance: 0.08,
  support: 0.05,
  responsible_ai: 0.08,
  community: 0.05,
  popularity: 0.03,
  incident_history: 0.08,
  update_cadence: 0.05,
  open_source_health: 0.04,
  dependency_risk: 0.05,
  vulnerability_history: 0.05,
};

export type EvidenceContribution = {
  evidenceId: string;
  dimension: TrustDimension;
  value: number;
  confidence: number;
  rationale: string;
};

export type TrustScoreComponent = {
  dimension: TrustDimension;
  score: number;
  weight: number;
  weightedScore: number;
  evidenceIds: string[];
  rationale: string;
};

export type TrustScoreResult = {
  score: number;
  confidence: number;
  methodologyVersion: string;
  components: TrustScoreComponent[];
  explanation: string;
};

const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, value));

/**
 * Produces a deterministic, inspectable score. Missing evidence does not become
 * a hidden negative. It contributes a neutral score with zero confidence and is
 * called out explicitly in the explanation.
 */
export function calculateTrustScore(
  evidence: readonly EvidenceContribution[],
  weights: Readonly<Record<TrustDimension, number>> = DEFAULT_WEIGHTS,
): TrustScoreResult {
  const weightTotal = Object.values(weights).reduce((total, weight) => total + weight, 0);
  if (Math.abs(weightTotal - 1) > 0.0001) throw new Error("Trust score weights must total 1");

  const components = TRUST_DIMENSIONS.map<TrustScoreComponent>((dimension) => {
    const matching = evidence.filter((item) => item.dimension === dimension);
    const confidenceTotal = matching.reduce((total, item) => total + clamp(item.confidence, 0, 1), 0);
    const score = confidenceTotal === 0
      ? 50
      : matching.reduce((total, item) => total + clamp(item.value) * clamp(item.confidence, 0, 1), 0) / confidenceTotal;
    const roundedScore = Number(score.toFixed(2));
    return {
      dimension,
      score: roundedScore,
      weight: weights[dimension],
      weightedScore: Number((roundedScore * weights[dimension]).toFixed(2)),
      evidenceIds: matching.map((item) => item.evidenceId),
      rationale: matching.length === 0
        ? "No verified evidence is available; neutral score with zero confidence."
        : matching.map((item) => item.rationale).join(" "),
    };
  });

  const score = Number(components.reduce((total, component) => total + component.weightedScore, 0).toFixed(2));
  const coveredWeight = components
    .filter((component) => component.evidenceIds.length > 0)
    .reduce((total, component) => total + component.weight, 0);
  const confidence = Number(clamp(coveredWeight, 0, 1).toFixed(4));
  const missing = components.filter((component) => component.evidenceIds.length === 0).map((component) => component.dimension);

  return {
    score,
    confidence,
    methodologyVersion: TRUST_METHODOLOGY_VERSION,
    components,
    explanation: missing.length === 0
      ? "All trust dimensions are supported by evidence."
      : `Evidence coverage is incomplete. Missing dimensions: ${missing.join(", ")}.`,
  };
}
