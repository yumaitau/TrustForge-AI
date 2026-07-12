export const MARKETPLACE_RANKING_POLICY_VERSION = "2026.7";

/**
 * Published ranking policy (docs/marketplace.md):
 *   rank = trustScore weighted by evidence confidence, plus a small bonus for
 *   stronger verification levels. Sponsorship is NEVER an input — sponsored
 *   placements are returned in a separate, always-labelled list and cannot
 *   change organic order or any trust score. Ties break on listing id so the
 *   ordering is stable and reproducible.
 */
export type RankableListing = {
  listingId: string;
  title: string;
  trustScore: number | null;
  trustConfidence: number | null;
  verificationLevel?: string | null;
  sponsored?: { slot: string; disclosureLabel: string } | null;
};

export type RankedListing = RankableListing & { rankScore: number; rankPolicyVersion: string };

const VERIFICATION_BONUS: Record<string, number> = {
  community_verified: 1, identity_verified: 2, organisation_verified: 3,
  security_verified: 4, enterprise_verified: 5, government_ready: 6, independently_audited: 7,
};

export function rankScore(listing: RankableListing): number {
  const score = listing.trustScore ?? 50;
  const confidence = Math.min(Math.max(listing.trustConfidence ?? 0, 0), 1);
  const bonus = VERIFICATION_BONUS[listing.verificationLevel ?? ""] ?? 0;
  return Number((score * (0.7 + 0.3 * confidence) + bonus).toFixed(4));
}

export function rankListings(listings: readonly RankableListing[]): { organic: RankedListing[]; sponsored: RankedListing[]; rankPolicyVersion: string } {
  const ranked = listings.map<RankedListing>((listing) => ({ ...listing, rankScore: rankScore({ ...listing, sponsored: null }), rankPolicyVersion: MARKETPLACE_RANKING_POLICY_VERSION }));
  const byRank = (a: RankedListing, b: RankedListing) => b.rankScore - a.rankScore || a.listingId.localeCompare(b.listingId);
  return {
    organic: ranked.slice().sort(byRank),
    sponsored: ranked.filter((listing) => listing.sponsored).sort(byRank),
    rankPolicyVersion: MARKETPLACE_RANKING_POLICY_VERSION,
  };
}
