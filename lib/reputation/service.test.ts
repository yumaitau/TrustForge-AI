import { describe, expect, it } from "vitest";
import { reputationWeight } from "./service";

describe("reputation weighting", () => {
  it("never reduces a valid vote below one or allows unbounded influence", () => {
    expect(reputationWeight(-100)).toBe(1);
    expect(reputationWeight(0)).toBe(1);
    expect(reputationWeight(400)).toBe(2);
    expect(reputationWeight(1_000_000)).toBe(3);
  });
});
