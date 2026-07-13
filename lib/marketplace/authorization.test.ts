import { describe, expect, it } from "vitest";
import { canResolveDispute, isDisputeParty } from "./authorization";

const SELLER = "org-seller";
const BUYER = "org-buyer";
const OUTSIDER = "org-outsider";

describe("isDisputeParty", () => {
  it("admits the seller organisation and the buyer organisation on the order", () => {
    expect(isDisputeParty(SELLER, SELLER, BUYER)).toBe(true);
    expect(isDisputeParty(BUYER, SELLER, BUYER)).toBe(true);
  });

  it("rejects an unrelated organisation", () => {
    expect(isDisputeParty(OUTSIDER, SELLER, BUYER)).toBe(false);
    expect(isDisputeParty(OUTSIDER, SELLER, null)).toBe(false);
  });

  it("does not treat a missing buyer as a wildcard", () => {
    expect(isDisputeParty(BUYER, SELLER, null)).toBe(false);
  });
});

describe("canResolveDispute", () => {
  it("only the listing's seller organisation can resolve", () => {
    expect(canResolveDispute(SELLER, SELLER)).toBe(true);
    // Regression: resolveDispute updated by id alone, so a buyer or outsider could
    // resolve another organisation's dispute.
    expect(canResolveDispute(BUYER, SELLER)).toBe(false);
    expect(canResolveDispute(OUTSIDER, SELLER)).toBe(false);
    expect(canResolveDispute(SELLER, null)).toBe(false);
  });
});
