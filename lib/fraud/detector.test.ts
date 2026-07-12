import { describe, expect, it } from "vitest";
import { detectReviewFraud, reviewContentHash } from "./detector";

describe("review fraud heuristics", () => {
  it("normalizes duplicate content and detects cross-account reuse", () => {
    expect(reviewContentHash("Good", "Works well")).toBe(reviewContentHash("GOOD", "  works   well "));
    const now = new Date();
    expect(detectReviewFraud([{ userId: "a", content: "same", createdAt: now }, { userId: "b", content: " SAME ", createdAt: now }]).map((item) => item.signal)).toContain("duplicate_content");
  });
});
