import { describe, expect, it } from "vitest";
import { calculateTrustScore, DEFAULT_WEIGHTS, TRUST_DIMENSIONS } from "./methodology";

describe("calculateTrustScore", () => {
  it("is neutral and explicitly uncertain without evidence", () => {
    const result = calculateTrustScore([]);
    expect(result.score).toBe(50);
    expect(result.confidence).toBe(0);
    expect(result.components).toHaveLength(TRUST_DIMENSIONS.length);
    expect(result.explanation).toContain("incomplete");
  });

  it("links every scored component to its evidence", () => {
    const result = calculateTrustScore([{ evidenceId: "ev-1", dimension: "security", value: 90, confidence: 1, rationale: "Signed releases verified." }]);
    const security = result.components.find((component) => component.dimension === "security");
    expect(security).toMatchObject({ score: 90, evidenceIds: ["ev-1"] });
    expect(result.confidence).toBe(DEFAULT_WEIGHTS.security);
  });

  it("rejects opaque weighting configurations", () => {
    expect(() => calculateTrustScore([], { ...DEFAULT_WEIGHTS, security: 0.5 })).toThrow(/total 1/);
  });
});
