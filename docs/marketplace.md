# Verified AI marketplace

Phase 8 turns trusted discovery into adoption without compromising editorial independence. The commercial domain (`lib/marketplace/`, `db/schema/marketplace.ts`) is fully separated from the trust domain: no marketplace code path writes evidence, trust scores, or score components.

## Conflict controls

- **Sponsored placement cannot alter trust scores or organic ranking.** Sponsorship is not an input to `rankScore`; sponsored placements are returned in a separate list and must carry a disclosure label that states they are sponsored (enforced at creation).
- **Commercial relationships are disclosed.** Every listing requires a `commercialRelationship` (seller, reseller, affiliate, sponsor, partner) and a `disclosureSummary`; both are public.
- **Seller verification gates selling.** Listings, offers, and placements require a verified seller profile. Verification status changes are audit-logged.
- **Everything is audit-logged.** Seller, listing, offer, placement, order, and dispute actions write `audit_events` records.

## Published ranking policy (version 2026.7)

Organic order is computed by `lib/marketplace/ranking.ts`:

```
rank = trustScore × (0.7 + 0.3 × evidenceConfidence) + verificationBonus
```

- `trustScore` is the subject's current published Trust Score (neutral 50 when unscored).
- `evidenceConfidence` is the score's evidence confidence (0 when unknown).
- `verificationBonus` adds 1–7 points across the verification ladder (community_verified → independently_audited).
- Ties break on listing id, so order is stable and reproducible.
- Sponsorship, payment, and partner status are **never** ranking inputs.

## Billing and tax

Offers are priced in integer minor units. `lib/marketplace/tax.ts` performs deterministic tax calculation per buyer region: GST/VAT is backed out of tax-inclusive prices (AU, NZ, GB, DE, FR, SG) or added on top elsewhere; regions without platform-collected tax (for example US state-level sales tax) record zero with the basis captured on the order. Orders persist net, tax, total, tax kind, and rate basis points for audit.

## Disputes

Buyers open disputes against listings (billing, misrepresentation, quality, tax, other). Dispute resolution is restricted to `marketplace:manage` and records resolver and timestamps.

## API

- `GET /api/v1/marketplace/listings` — public ranked listings (organic + labelled sponsored, with rank policy version)
- `POST /api/v1/marketplace/sellers`, `POST /api/v1/marketplace/sellers/:id/status`
- `POST /api/v1/marketplace/listings`, `POST /api/v1/marketplace/listings/:id/publish`
- `POST /api/v1/marketplace/offers`, `POST /api/v1/marketplace/placements`
- `POST /api/v1/marketplace/orders`, `POST /api/v1/marketplace/disputes`, `PATCH /api/v1/marketplace/disputes/:id`

## Future work

Usage-based purchasing, reseller channels, escrow, insurance, enterprise private marketplaces, and payment-provider integration (orders currently stop at the `pending` ledger entry).
