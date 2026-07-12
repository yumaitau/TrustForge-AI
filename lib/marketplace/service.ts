import { and, desc, eq, lte, gte } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { auditEvents, listings, marketplaceDisputes, marketplaceOrders, offers, sellerProfiles, sponsoredPlacements, trustScores } from "@/db/schema";
import { db } from "@/lib/db/client";
import { rankListings, type RankableListing } from "./ranking";
import { calculateTax } from "./tax";

type Actor = { userId: string; organisationId: string };
const subjectTypes = ["company", "product", "mcp_server", "skill", "agent", "model", "api"] as const;

export const sellerSchema = z.object({ legalEntityName: z.string().min(2).max(240), countryCode: z.string().length(2).transform((value) => value.toUpperCase()), taxIdentifier: z.string().max(64).optional() });
export const sellerStatusSchema = z.object({ status: z.enum(["verified", "suspended", "revoked"]), reason: z.string().max(2000).optional() });
export const listingSchema = z.object({ subjectType: z.enum(subjectTypes), subjectId: z.uuid(), title: z.string().min(3).max(240), description: z.string().max(8000).optional(), commercialRelationship: z.enum(["seller", "reseller", "affiliate", "sponsor", "partner"]), disclosureSummary: z.string().min(10).max(2000) });
export const offerSchema = z.object({ listingId: z.uuid(), name: z.string().min(2).max(160), pricingModel: z.enum(["free", "one_time", "subscription", "usage_based"]), priceMinorUnits: z.number().int().min(0).max(1_000_000_000).default(0), currency: z.string().length(3).transform((value) => value.toUpperCase()).default("AUD"), billingPeriod: z.enum(["monthly", "annual"]).optional(), usageUnit: z.string().max(80).optional(), regionCodes: z.array(z.string().length(2)).max(50).default([]) });
export const placementSchema = z.object({ listingId: z.uuid(), slot: z.string().min(2).max(80), disclosureLabel: z.string().min(4).max(120), startsAt: z.coerce.date(), endsAt: z.coerce.date() });
export const disputeSchema = z.object({ listingId: z.uuid(), orderId: z.uuid().optional(), kind: z.enum(["billing", "misrepresentation", "quality", "tax", "other"]), description: z.string().min(10).max(8000) });
export const disputeResolutionSchema = z.object({ status: z.enum(["under_review", "resolved", "rejected"]), resolution: z.string().max(8000).optional() });
export const orderSchema = z.object({ offerId: z.uuid(), buyerCountryCode: z.string().length(2).transform((value) => value.toUpperCase()) });

const audit = (tx: Pick<typeof db, "insert">, actor: Actor, action: string, resourceType: string, resourceId: string, metadata?: Record<string, unknown>) =>
  tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action, resourceType, resourceId, metadata });

export async function createSellerProfile(input: unknown, actor: Actor) {
  const parsed = sellerSchema.parse(input);
  const [profile] = await db.insert(sellerProfiles).values({ id: uuidv7(), organisationId: actor.organisationId, ...parsed, createdByUserId: actor.userId }).returning();
  await audit(db, actor, "marketplace.seller_created", "seller_profile", profile.id);
  return profile;
}

export async function setSellerStatus(id: string, input: unknown, actor: Actor) {
  const parsed = sellerStatusSchema.parse(input);
  const [profile] = await db.update(sellerProfiles).set({ status: parsed.status, verifiedAt: parsed.status === "verified" ? new Date() : undefined, suspendedReason: parsed.status === "verified" ? null : parsed.reason ?? null, updatedAt: new Date() }).where(and(eq(sellerProfiles.id, id), eq(sellerProfiles.organisationId, actor.organisationId))).returning();
  if (!profile) throw new Error("Seller profile not found");
  await audit(db, actor, "marketplace.seller_status_changed", "seller_profile", id, { status: parsed.status, reason: parsed.reason });
  return profile;
}

async function requireVerifiedSeller(actor: Actor) {
  const [seller] = await db.select().from(sellerProfiles).where(eq(sellerProfiles.organisationId, actor.organisationId)).limit(1);
  if (!seller) throw new Error("A seller profile is required before listing");
  if (seller.status !== "verified") throw new Error("Seller verification is required before listing");
  return seller;
}

export async function createListing(input: unknown, actor: Actor) {
  const parsed = listingSchema.parse(input);
  const seller = await requireVerifiedSeller(actor);
  const [listing] = await db.insert(listings).values({ id: uuidv7(), sellerId: seller.id, ...parsed, createdByUserId: actor.userId }).returning();
  await audit(db, actor, "marketplace.listing_created", "listing", listing.id, { commercialRelationship: parsed.commercialRelationship });
  return listing;
}

export async function publishListing(id: string, actor: Actor) {
  const seller = await requireVerifiedSeller(actor);
  return db.transaction(async (tx) => {
    const [listing] = await tx.select().from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, seller.id))).limit(1);
    if (!listing) throw new Error("Listing not found");
    if (listing.status !== "draft") throw new Error("Only draft listings can be published");
    const [published] = await tx.update(listings).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(eq(listings.id, id)).returning();
    await audit(tx, actor, "marketplace.listing_published", "listing", id);
    return published;
  });
}

export async function createOffer(input: unknown, actor: Actor) {
  const parsed = offerSchema.parse(input);
  const seller = await requireVerifiedSeller(actor);
  const [listing] = await db.select().from(listings).where(and(eq(listings.id, parsed.listingId), eq(listings.sellerId, seller.id))).limit(1);
  if (!listing) throw new Error("Listing not found");
  if (parsed.pricingModel !== "free" && parsed.priceMinorUnits === 0) throw new Error("Paid pricing models require a price");
  const [offer] = await db.insert(offers).values({ id: uuidv7(), ...parsed }).returning();
  await audit(db, actor, "marketplace.offer_created", "offer", offer.id, { listingId: parsed.listingId, pricingModel: parsed.pricingModel });
  return offer;
}

export async function createSponsoredPlacement(input: unknown, actor: Actor) {
  const parsed = placementSchema.parse(input);
  if (!/sponsor/i.test(parsed.disclosureLabel)) throw new Error("The disclosure label must state that the placement is sponsored");
  if (parsed.endsAt <= parsed.startsAt) throw new Error("The placement window must end after it starts");
  const seller = await requireVerifiedSeller(actor);
  const [listing] = await db.select().from(listings).where(and(eq(listings.id, parsed.listingId), eq(listings.sellerId, seller.id))).limit(1);
  if (!listing) throw new Error("Listing not found");
  const [placement] = await db.insert(sponsoredPlacements).values({ id: uuidv7(), ...parsed, createdByUserId: actor.userId }).returning();
  await audit(db, actor, "marketplace.placement_created", "sponsored_placement", placement.id, { listingId: parsed.listingId, slot: parsed.slot });
  return placement;
}

export async function createOrder(input: unknown, actor: Actor) {
  const parsed = orderSchema.parse(input);
  const [offer] = await db.select().from(offers).where(eq(offers.id, parsed.offerId)).limit(1);
  if (!offer) throw new Error("Offer not found");
  if (offer.regionCodes.length > 0 && !offer.regionCodes.includes(parsed.buyerCountryCode)) throw new Error("The offer is not available in the buyer's region");
  const tax = calculateTax(offer.priceMinorUnits, parsed.buyerCountryCode);
  const [order] = await db.insert(marketplaceOrders).values({ id: uuidv7(), offerId: offer.id, organisationId: actor.organisationId, amountMinorUnits: tax.netMinorUnits, taxMinorUnits: tax.taxMinorUnits, totalMinorUnits: tax.totalMinorUnits, currency: offer.currency, buyerCountryCode: parsed.buyerCountryCode, taxKind: tax.region.kind, taxRateBasisPoints: tax.region.rateBasisPoints, createdByUserId: actor.userId }).returning();
  await audit(db, actor, "marketplace.order_created", "marketplace_order", order.id, { offerId: offer.id, totalMinorUnits: tax.totalMinorUnits, taxKind: tax.region.kind });
  return order;
}

export async function openDispute(input: unknown, actor: Actor) {
  const parsed = disputeSchema.parse(input);
  const [dispute] = await db.insert(marketplaceDisputes).values({ id: uuidv7(), ...parsed, raisedByUserId: actor.userId }).returning();
  await audit(db, actor, "marketplace.dispute_opened", "marketplace_dispute", dispute.id, { listingId: parsed.listingId, kind: parsed.kind });
  return dispute;
}

export async function resolveDispute(id: string, input: unknown, actor: Actor) {
  const parsed = disputeResolutionSchema.parse(input);
  const [dispute] = await db.update(marketplaceDisputes).set({ status: parsed.status, resolution: parsed.resolution, resolvedByUserId: parsed.status === "under_review" ? undefined : actor.userId, resolvedAt: parsed.status === "under_review" ? undefined : new Date() }).where(eq(marketplaceDisputes.id, id)).returning();
  if (!dispute) throw new Error("Dispute not found");
  await audit(db, actor, "marketplace.dispute_updated", "marketplace_dispute", id, { status: parsed.status });
  return dispute;
}

/**
 * Public marketplace view. Organic order comes only from trust scores,
 * confidence, and verification level (see lib/marketplace/ranking.ts); active
 * sponsored placements are returned separately with their disclosure labels.
 */
export async function publishedListings(limit = 50) {
  const now = new Date();
  const rows = await db.select().from(listings).where(eq(listings.status, "published")).orderBy(desc(listings.publishedAt)).limit(Math.min(Math.max(limit, 1), 100));
  const rankable = await Promise.all(rows.map(async (listing): Promise<RankableListing> => {
    const [score] = await db.select().from(trustScores).where(and(eq(trustScores.subjectType, listing.subjectType), eq(trustScores.subjectId, listing.subjectId))).orderBy(desc(trustScores.calculatedAt)).limit(1);
    const [placement] = await db.select().from(sponsoredPlacements).where(and(eq(sponsoredPlacements.listingId, listing.id), lte(sponsoredPlacements.startsAt, now), gte(sponsoredPlacements.endsAt, now))).limit(1);
    const summary = (score?.explanation as { summary?: string } | null)?.summary ?? "";
    const confidenceMatch = summary.match(/Confidence: (\d+)%/);
    return { listingId: listing.id, title: listing.title, trustScore: score ? Number(score.score) : null, trustConfidence: confidenceMatch ? Number(confidenceMatch[1]) / 100 : null, sponsored: placement ? { slot: placement.slot, disclosureLabel: placement.disclosureLabel } : null };
  }));
  const ranked = rankListings(rankable);
  const byId = new Map(rows.map((listing) => [listing.id, listing]));
  const decorate = (entry: (typeof ranked.organic)[number]) => ({ ...entry, listing: byId.get(entry.listingId) });
  return { organic: ranked.organic.map(decorate), sponsored: ranked.sponsored.map(decorate), rankPolicyVersion: ranked.rankPolicyVersion };
}
