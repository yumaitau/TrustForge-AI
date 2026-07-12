import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { auditEvents, evidence, evidenceChallenges } from "@/db/schema";
import { db } from "@/lib/db/client";

export const evidenceInputSchema = z.object({
  subjectType: z.enum(["company", "product", "mcp_server", "skill", "agent", "model", "api"]),
  subjectId: z.uuid(),
  type: z.string().trim().min(2).max(80),
  dimension: z.enum(["security", "privacy", "transparency", "documentation", "maintenance", "support", "responsible_ai", "community", "popularity", "incident_history", "update_cadence", "open_source_health", "dependency_risk", "vulnerability_history"]),
  value: z.number().min(0).max(100),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(4_000).optional(),
  source: z.enum(["first_party", "registry", "repository", "automated_scan", "community", "independent_audit"]),
  sourceUrl: z.url().optional(),
  confidence: z.number().min(0).max(1),
  observedAt: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
  supersedesEvidenceId: z.uuid().optional(),
});

export type EvidenceInput = z.infer<typeof evidenceInputSchema>;
export type EvidenceStatus = "pending" | "verified" | "rejected" | "expired" | "superseded";

const transitions: Record<EvidenceStatus, readonly EvidenceStatus[]> = {
  pending: ["verified", "rejected"],
  verified: ["expired", "superseded"],
  rejected: [], expired: [], superseded: [],
};

export function assertEvidenceTransition(from: EvidenceStatus, to: EvidenceStatus) {
  if (!transitions[from].includes(to)) throw new Error(`Invalid evidence transition from ${from} to ${to}`);
}

export function evidenceContentHash(input: EvidenceInput) {
  const canonical = JSON.stringify({
    ...input,
    observedAt: input.observedAt.toISOString(),
    validUntil: input.validUntil?.toISOString() ?? null,
  }, Object.keys({ ...input, observedAt: "", validUntil: "" }).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

export async function submitEvidence(input: EvidenceInput, actor: { userId: string; organisationId: string }) {
  const parsed = evidenceInputSchema.parse(input);
  const id = uuidv7();
  return db.transaction(async (tx) => {
    let version = 1;
    if (parsed.supersedesEvidenceId) {
      const [prior] = await tx.select({ subjectType: evidence.subjectType, subjectId: evidence.subjectId, version: evidence.version, status: evidence.status }).from(evidence).where(eq(evidence.id, parsed.supersedesEvidenceId)).limit(1);
      if (!prior || prior.subjectType !== parsed.subjectType || prior.subjectId !== parsed.subjectId || prior.status !== "verified") throw new Error("Only verified evidence for the same subject can be superseded");
      version = prior.version + 1;
    }
    const [row] = await tx.insert(evidence).values({ id, ...parsed, version, value: String(parsed.value), confidence: String(parsed.confidence), contentHash: evidenceContentHash(parsed), submittedByUserId: actor.userId }).returning();
    await tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "evidence.submitted", resourceType: "evidence", resourceId: id });
    return row;
  });
}

export async function adjudicateEvidence(input: { evidenceId: string; status: "verified" | "rejected"; actorUserId: string; organisationId: string }) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select({ status: evidence.status }).from(evidence).where(eq(evidence.id, input.evidenceId)).limit(1);
    if (!current) throw new Error("Evidence not found");
    assertEvidenceTransition(current.status, input.status);
    const [updated] = await tx.update(evidence).set({ status: input.status, updatedAt: new Date() }).where(and(eq(evidence.id, input.evidenceId), eq(evidence.status, current.status))).returning();
    if (!updated) throw new Error("Evidence changed during adjudication");
    if (input.status === "verified" && updated.supersedesEvidenceId) await tx.update(evidence).set({ status: "superseded", updatedAt: new Date() }).where(and(eq(evidence.id, updated.supersedesEvidenceId), eq(evidence.status, "verified")));
    await tx.insert(auditEvents).values({ organisationId: input.organisationId, actorUserId: input.actorUserId, action: `evidence.${input.status}`, resourceType: "evidence", resourceId: input.evidenceId });
    return updated;
  });
}

export async function challengeEvidence(input: { evidenceId: string; userId: string; reason: string; supportingEvidenceIds?: string[] }) {
  const [challenge] = await db.insert(evidenceChallenges).values({ id: uuidv7(), evidenceId: input.evidenceId, submittedByUserId: input.userId, reason: input.reason, supportingEvidenceIds: input.supportingEvidenceIds ?? [] }).returning();
  return challenge;
}
