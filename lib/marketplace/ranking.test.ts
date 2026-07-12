import { describe, expect, it } from "vitest";
import { rankListings, rankScore, type RankableListing } from "./ranking";

const listing = (overrides: Partial<RankableListing> & { listingId: string }): RankableListing => ({
  title: overrides.listingId,
  trustScore: null,
  trustConfidence: null,
  sponsored: null,
  ...overrides,
});

describe("rankListings", () => {
  it("orders organically by trust score, confidence, and verification", () => {
    const result = rankListings([
      listing({ listingId: "low", trustScore: 40, trustConfidence: 1 }),
      listing({ listingId: "high", trustScore: 90, trustConfidence: 1 }),
      listing({ listingId: "unscored" }),
    ]);
    expect(result.organic.map((entry) => entry.listingId)).toEqual(["high", "low", "unscored"]);
    expect(result.rankPolicyVersion).toBe("2026.7");
  });

  it("never lets sponsorship alter organic order or rank score", () => {
    const plain = [listing({ listingId: "a", trustScore: 80, trustConfidence: 0.9 }), listing({ listingId: "b", trustScore: 60, trustConfidence: 0.9 })];
    const withSponsorship = [plain[0], { ...plain[1], sponsored: { slot: "home_hero", disclosureLabel: "Sponsored placement" } }];
    const before = rankListings(plain);
    const after = rankListings(withSponsorship);
    expect(after.organic.map((entry) => entry.listingId)).toEqual(before.organic.map((entry) => entry.listingId));
    expect(after.organic.map((entry) => entry.rankScore)).toEqual(before.organic.map((entry) => entry.rankScore));
    expect(rankScore(withSponsorship[1])).toBe(rankScore(plain[1]));
  });

  it("lists sponsored placements separately, always with their disclosure", () => {
    const result = rankListings([
      listing({ listingId: "organic-only", trustScore: 95, trustConfidence: 1 }),
      listing({ listingId: "paid", trustScore: 30, trustConfidence: 0.5, sponsored: { slot: "home_hero", disclosureLabel: "Sponsored placement" } }),
    ]);
    expect(result.sponsored).toHaveLength(1);
    expect(result.sponsored[0]?.listingId).toBe("paid");
    expect(result.sponsored[0]?.sponsored?.disclosureLabel).toContain("Sponsored");
    expect(result.organic.map((entry) => entry.listingId)).toEqual(["organic-only", "paid"]);
  });

  it("breaks ties deterministically by listing id", () => {
    const result = rankListings([listing({ listingId: "b", trustScore: 70, trustConfidence: 1 }), listing({ listingId: "a", trustScore: 70, trustConfidence: 1 })]);
    expect(result.organic.map((entry) => entry.listingId)).toEqual(["a", "b"]);
  });
});
