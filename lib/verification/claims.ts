import { createHash, createHmac, randomBytes, timingSafeEqual, verify as verifySignature } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { companies, products, vendorClaims } from "@/db/schema";
import { db } from "@/lib/db/client";

export type ClaimMethod = "dns" | "email" | "github" | "oauth" | "signed_challenge";
const digest = (value: string) => createHash("sha256").update(value).digest();
const digestHex = (value: string) => digest(value).toString("hex");

export async function createVendorClaim(input: { subjectType: "company" | "product"; subjectId: string; organisationId: string; userId: string; method: ClaimMethod; target?: string; provider?: string; publicKey?: string }) {
  const challenge = randomBytes(32).toString("base64url");
  // The email path proves mailbox control with a server-generated secret code that is
  // delivered out-of-band to an address at the claimed domain. Only its hash is stored,
  // and it is never exposed on the claim record — knowing the code is the proof.
  const code = input.method === "email" ? randomBytes(9).toString("base64url") : undefined;
  const [claim] = await db.insert(vendorClaims).values({
    id: uuidv7(), subjectType: input.subjectType, subjectId: input.subjectId, organisationId: input.organisationId,
    requestedByUserId: input.userId, method: input.method, challengeHash: digestHex(challenge),
    challengeMetadata: { target: input.target, provider: input.provider, publicKey: input.publicKey, codeHash: code ? digestHex(code) : undefined },
    expiresAt: new Date(Date.now() + 30 * 60_000),
  }).returning();
  return { claim, challenge, code };
}

export function verifyChallengeHash(challenge: string, expectedHex: string) {
  const actual = digest(challenge); const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Timing-safe comparison of a presented secret against a stored SHA-256 hex digest. */
export function verifySecretHash(secret: string | undefined, expectedHex: string | undefined) {
  if (!secret || !expectedHex) return false;
  return verifyChallengeHash(secret, expectedHex);
}

export async function verifyVendorClaim(claimId: string, proof: { challenge?: string; code?: string; signature?: string; providerAttestation?: string }) {
  const [claim] = await db.select().from(vendorClaims).where(eq(vendorClaims.id, claimId)).limit(1);
  if (!claim || claim.status !== "pending") throw new Error("Claim is not pending");
  if (claim.expiresAt <= new Date()) { await db.update(vendorClaims).set({ status: "expired", updatedAt: new Date() }).where(eq(vendorClaims.id, claimId)); throw new Error("Claim expired"); }
  // Email proves control with the emailed code alone; every other method binds to the
  // published/attested challenge, so its correlation hash must match first.
  if (claim.method !== "email" && !(proof.challenge && verifyChallengeHash(proof.challenge, claim.challengeHash))) throw new Error("Challenge does not match");

  let verified = false;
  if (claim.method === "email") verified = verifySecretHash(proof.code, claim.challengeMetadata.codeHash);
  if (claim.method === "dns" && claim.challengeMetadata.target) {
    const records = (await resolveTxt(claim.challengeMetadata.target)).flat();
    verified = records.includes(`trustforge-verification=${proof.challenge}`);
  }
  if ((claim.method === "github" || claim.method === "oauth") && proof.providerAttestation) {
    const secret = process.env.CLAIM_PROVIDER_ATTESTATION_SECRET;
    if (!secret) throw new Error("Provider attestation is not configured");
    const expected = createHmac("sha256", secret).update(`${claim.method}:${claim.id}:${proof.challenge}`).digest("base64url");
    const expectedBuffer = Buffer.from(expected); const actualBuffer = Buffer.from(proof.providerAttestation);
    verified = expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
  }
  if (claim.method === "signed_challenge" && claim.challengeMetadata.publicKey && proof.signature && proof.challenge) {
    verified = verifySignature(null, Buffer.from(proof.challenge), claim.challengeMetadata.publicKey, Buffer.from(proof.signature, "base64"));
  }
  const attempt = { at: new Date().toISOString(), outcome: verified ? "verified" : "failed" };
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(vendorClaims).set({ status: verified ? "verified" : "failed", verifiedAt: verified ? new Date() : null, attempts: [...claim.attempts, attempt], updatedAt: new Date() }).where(eq(vendorClaims.id, claimId)).returning();
    if (verified && claim.subjectType === "company") await tx.update(companies).set({ claimedByOrganisationId: claim.organisationId, verificationLevel: "organisation_verified", updatedAt: new Date() }).where(eq(companies.id, claim.subjectId));
    if (verified && claim.subjectType === "product") await tx.update(products).set({ verificationLevel: "organisation_verified", updatedAt: new Date() }).where(eq(products.id, claim.subjectId));
    return updated;
  });
}

export async function revokeVendorClaim(claimId: string, organisationId: string) {
  const [claim] = await db.select().from(vendorClaims).where(eq(vendorClaims.id, claimId)).limit(1);
  if (!claim || claim.organisationId !== organisationId || claim.status !== "verified") throw new Error("Verified claim not found");
  return db.transaction(async (tx) => {
    const [revoked] = await tx.update(vendorClaims).set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() }).where(eq(vendorClaims.id, claimId)).returning();
    if (claim.subjectType === "company") await tx.update(companies).set({ claimedByOrganisationId: null, verificationLevel: "unverified", updatedAt: new Date() }).where(eq(companies.id, claim.subjectId));
    if (claim.subjectType === "product") await tx.update(products).set({ verificationLevel: "unverified", updatedAt: new Date() }).where(eq(products.id, claim.subjectId));
    return revoked;
  });
}
