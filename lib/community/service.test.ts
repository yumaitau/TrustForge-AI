import { describe, expect, it } from "vitest";
import { resolveReviewDecision } from "./service";

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
