import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { auditEvents, sbomComponents, securityAdvisories, securityFindings, softwareBillsOfMaterials } from "@/db/schema";
import { db } from "@/lib/db/client";
import { advisoryInputSchema, findingAdjudicationSchema, findingInputSchema, sbomInputSchema, type AdvisoryInput } from "./schemas";

export function sha256(value: string | Uint8Array) { return createHash("sha256").update(value).digest("hex"); }

export async function upsertAdvisory(input: AdvisoryInput, actor: { userId: string; organisationId: string }) {
  const parsed = advisoryInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(securityAdvisories).values({ id: uuidv7(), ...parsed, snapshot: { ...parsed.snapshot, fetchedAt: parsed.snapshot.fetchedAt.toISOString() } }).onConflictDoUpdate({ target: [securityAdvisories.source, securityAdvisories.externalId], set: { aliases: parsed.aliases, summary: parsed.summary, details: parsed.details, severity: parsed.severity, affected: parsed.affected, sourceUrl: parsed.sourceUrl, publishedAt: parsed.publishedAt, modifiedAt: parsed.modifiedAt, snapshot: { ...parsed.snapshot, fetchedAt: parsed.snapshot.fetchedAt.toISOString() }, updatedAt: new Date() } }).returning();
    await tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "security.advisory_upserted", resourceType: "security_advisory", resourceId: row.id, metadata: { source: row.source, externalId: row.externalId } });
    return row;
  });
}

export async function upsertFinding(input: unknown, actor: { userId: string; organisationId: string }) {
  const parsed = findingInputSchema.parse(input); const now = new Date();
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(securityFindings).values({ id: uuidv7(), ...parsed, rawSnapshot: { ...parsed.rawSnapshot, fetchedAt: parsed.rawSnapshot.fetchedAt.toISOString() }, firstObservedAt: now, lastObservedAt: now }).onConflictDoUpdate({ target: [securityFindings.subjectType, securityFindings.subjectId, securityFindings.scanner, securityFindings.fingerprint], set: { advisoryId: parsed.advisoryId, title: parsed.title, severity: parsed.severity, affectedComponent: parsed.affectedComponent, affectedVersion: parsed.affectedVersion, remediation: parsed.remediation, observed: parsed.observed, rawSnapshot: { ...parsed.rawSnapshot, fetchedAt: parsed.rawSnapshot.fetchedAt.toISOString() }, lastObservedAt: now, updatedAt: now } }).returning();
    await tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "security.finding_observed", resourceType: "security_finding", resourceId: row.id, metadata: { scanner: row.scanner, fingerprint: row.fingerprint } });
    return row;
  });
}

export async function adjudicateFinding(input: { findingId: string; status: "accepted_risk" | "false_positive" | "resolved" | "not_affected"; reason: string; actor: { userId: string; organisationId: string } }) {
  const parsed = findingAdjudicationSchema.parse(input); const now = new Date();
  const [row] = await db.update(securityFindings).set({ status: parsed.status, adjudicatedByUserId: input.actor.userId, adjudicationReason: parsed.reason, resolvedAt: parsed.status === "resolved" || parsed.status === "not_affected" ? now : undefined, updatedAt: now }).where(eq(securityFindings.id, input.findingId)).returning();
  if (!row) throw new Error("Security finding not found");
  await db.insert(auditEvents).values({ organisationId: input.actor.organisationId, actorUserId: input.actor.userId, action: "security.finding_adjudicated", resourceType: "security_finding", resourceId: row.id, metadata: { status: parsed.status } });
  return row;
}

export async function importSbom(input: unknown, actor: { userId: string; organisationId: string }) {
  const parsed = sbomInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const [document] = await tx.insert(softwareBillsOfMaterials).values({ id: uuidv7(), ...parsed, sourceSnapshot: { ...parsed.sourceSnapshot, fetchedAt: parsed.sourceSnapshot.fetchedAt.toISOString() }, importedByUserId: actor.userId }).onConflictDoNothing({ target: [softwareBillsOfMaterials.subjectType, softwareBillsOfMaterials.subjectId, softwareBillsOfMaterials.documentHash] }).returning();
    if (!document) throw new Error("This SBOM has already been imported for the subject");
    await tx.insert(sbomComponents).values(parsed.components.map((component) => ({ id: uuidv7(), sbomId: document.id, ...component })));
    await tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "security.sbom_imported", resourceType: "sbom", resourceId: document.id, metadata: { format: document.format, componentCount: parsed.components.length, documentHash: document.documentHash } });
    return document;
  });
}

export async function listFindings(subjectType: string, subjectId: string) { return db.select().from(securityFindings).where(and(eq(securityFindings.subjectType, subjectType as typeof securityFindings.subjectType.enumValues[number]), eq(securityFindings.subjectId, subjectId))).orderBy(securityFindings.severity, securityFindings.lastObservedAt).limit(500); }
