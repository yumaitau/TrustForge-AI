/**
 * Pure marketplace dispute authorization. A dispute has two legitimate parties:
 * the seller organisation that owns the listing, and — when the dispute cites an
 * order — the buyer organisation that placed it. Isolating the decision here keeps
 * it unit-testable and prevents the cross-tenant access that unscoped queries allowed.
 */
export function isDisputeParty(actorOrganisationId: string, sellerOrganisationId: string | null, buyerOrganisationId: string | null) {
  return actorOrganisationId === sellerOrganisationId || (buyerOrganisationId !== null && actorOrganisationId === buyerOrganisationId);
}

/** Only the seller organisation that owns the listing may adjudicate a dispute. */
export function canResolveDispute(actorOrganisationId: string, sellerOrganisationId: string | null) {
  return sellerOrganisationId !== null && actorOrganisationId === sellerOrganisationId;
}
