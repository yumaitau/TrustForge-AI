export const ALERT_KINDS = ["score_drop", "new_finding", "verification_change"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export type Severity = "unknown" | "none" | "low" | "medium" | "high" | "critical";
const SEVERITY_RANK: Record<Severity, number> = { unknown: 0, none: 0, low: 1, medium: 2, high: 3, critical: 4 };

export type AlertPreferenceLike = { scoreDrops: boolean; newFindings: boolean; verificationChanges: boolean; minSeverity: Severity };

export type TrustChangeEvent = {
  subjectType: string;
  subjectId: string;
  kind: AlertKind;
  /** For score_drop: new score minus previous score. Alerts fire only on decreases. */
  scoreDelta?: number;
  /** For new_finding. */
  severity?: Severity;
};

/**
 * Deterministic alert routing. Score alerts fire only on drops so noisy
 * upward revisions never page anyone; finding alerts respect the user's
 * minimum severity; verification alerts are opt-in.
 */
export function alertMatchesPreference(preference: AlertPreferenceLike, event: TrustChangeEvent): boolean {
  switch (event.kind) {
    case "score_drop":
      return preference.scoreDrops && (event.scoreDelta ?? 0) < 0;
    case "new_finding":
      return preference.newFindings && SEVERITY_RANK[event.severity ?? "unknown"] >= SEVERITY_RANK[preference.minSeverity];
    case "verification_change":
      return preference.verificationChanges;
  }
}
