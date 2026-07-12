import { describe, expect, it } from "vitest";
import { alertMatchesPreference, type AlertPreferenceLike } from "./alerts";

const preference: AlertPreferenceLike = { scoreDrops: true, newFindings: true, verificationChanges: false, minSeverity: "high" };
const subject = { subjectType: "product", subjectId: "s-1" } as const;

describe("alertMatchesPreference", () => {
  it("fires on score drops but never on score rises", () => {
    expect(alertMatchesPreference(preference, { ...subject, kind: "score_drop", scoreDelta: -4.5 })).toBe(true);
    expect(alertMatchesPreference(preference, { ...subject, kind: "score_drop", scoreDelta: 3 })).toBe(false);
    expect(alertMatchesPreference(preference, { ...subject, kind: "score_drop", scoreDelta: 0 })).toBe(false);
    expect(alertMatchesPreference({ ...preference, scoreDrops: false }, { ...subject, kind: "score_drop", scoreDelta: -10 })).toBe(false);
  });

  it("respects the minimum finding severity", () => {
    expect(alertMatchesPreference(preference, { ...subject, kind: "new_finding", severity: "critical" })).toBe(true);
    expect(alertMatchesPreference(preference, { ...subject, kind: "new_finding", severity: "high" })).toBe(true);
    expect(alertMatchesPreference(preference, { ...subject, kind: "new_finding", severity: "medium" })).toBe(false);
    expect(alertMatchesPreference(preference, { ...subject, kind: "new_finding" })).toBe(false);
    expect(alertMatchesPreference({ ...preference, minSeverity: "low" }, { ...subject, kind: "new_finding", severity: "low" })).toBe(true);
  });

  it("keeps verification changes opt-in", () => {
    expect(alertMatchesPreference(preference, { ...subject, kind: "verification_change" })).toBe(false);
    expect(alertMatchesPreference({ ...preference, verificationChanges: true }, { ...subject, kind: "verification_change" })).toBe(true);
  });
});
