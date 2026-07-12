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

  it("excludes expired evidence and exposes contradictions", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const result = calculateTrustScore([
      { evidenceId: "expired", dimension: "privacy", value: 100, confidence: 1, rationale: "Old policy.", validUntil: new Date("2025-01-01") },
      { evidenceId: "positive", dimension: "security", value: 90, confidence: 1, rationale: "Audit passed.", status: "verified" },
      { evidenceId: "negative", dimension: "security", value: 20, confidence: 1, rationale: "Critical incident.", status: "verified" },
    ], DEFAULT_WEIGHTS, now);
    expect(result.components.find((item) => item.dimension === "privacy")?.evidenceIds).toEqual([]);
    expect(result.components.find((item) => item.dimension === "security")?.rationale).toContain("contradictory");
  });

  it("rejects opaque weighting configurations", () => {
    expect(() => calculateTrustScore([], { ...DEFAULT_WEIGHTS, security: 0.5 })).toThrow(/total 1/);
  });
});
