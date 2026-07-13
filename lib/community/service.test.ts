import { describe, expect, it } from "vitest";
import { helpfulReputationAction, resolveReviewDecision } from "./service";

describe("helpfulReputationAction", () => {
  it("awards while helpful votes stand and revokes once the last one is withdrawn", () => {
    expect(helpfulReputationAction(2)).toBe("award");
    expect(helpfulReputationAction(1)).toBe("award");
    // Regression: withdrawing the final helpful vote used to leave the credit stranded.
    expect(helpfulReputationAction(0)).toBe("revoke");
  });
});

describe("resolveReviewDecision", () => {
  it("publishes a pending review", () => {
    expect(resolveReviewDecision("pending", "publish")).toEqual({ status: "published", publish: true });
  });

  it("rejects a pending review without publishing", () => {
    expect(resolveReviewDecision("pending", "reject")).toEqual({ status: "rejected", publish: false });
  });

  it("refuses to re-adjudicate a review that is not pending", () => {
    // Guards against reopening already-published/rejected reviews and double-awarding reputation.
    expect(() => resolveReviewDecision("published", "reject")).toThrow(/pending/);
    expect(() => resolveReviewDecision("rejected", "publish")).toThrow(/pending/);
  });
});
