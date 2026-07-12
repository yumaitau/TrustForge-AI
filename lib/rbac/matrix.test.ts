import { describe, expect, it } from "vitest";
import { ACTIONS, assertPermissionMatrix, isPermitted } from "./matrix";

describe("permission matrix", () => {
  it("enforces separation between evidence submission and adjudication", () => {
    expect(isPermitted(ACTIONS.evidenceSubmit, "analyst")).toBe(true);
    expect(isPermitted(ACTIONS.evidenceAdjudicate, "analyst")).toBe(false);
    expect(() => assertPermissionMatrix()).not.toThrow();
  });

  it("keeps viewers read-only", () => {
    expect(Object.values(ACTIONS).some((action) => isPermitted(action, "viewer"))).toBe(false);
  });
});
