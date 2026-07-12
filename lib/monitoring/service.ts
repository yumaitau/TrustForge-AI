import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { auditEvents, eventOutbox, monitoringRuns, monitoringSubscriptions, monitoringTargets } from "@/db/schema";
import { db } from "@/lib/db/client";
import { monitoringTargetInputSchema, subscriptionInputSchema } from "@/lib/security/schemas";

const MAX_ATTEMPTS = 5;
const retryDelay = (attempt: number) => Math.min(60 * 60 * 1_000, 30_000 * 2 ** Math.max(0, attempt - 1));

export async function createMonitoringTarget(input: unknown, actor: { userId: string; organisationId: string }) {
  const parsed = monitoringTargetInputSchema.parse(input);
  const [target] = await db.insert(monitoringTargets).values({ id: uuidv7(), organisationId: actor.organisationId, ...parsed, nextCheckAt: new Date(Date.now() + Math.floor(Math.random() * 60_000)) }).onConflictDoUpdate({ target: [monitoringTargets.organisationId, monitoringTargets.targetType, monitoringTargets.target], set: { subjectType: parsed.subjectType, subjectId: parsed.subjectId, source: parsed.source, intervalMinutes: parsed.intervalMinutes, configuration: parsed.configuration, enabled: true, updatedAt: new Date() } }).returning();
  await db.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "monitoring.target_configured", resourceType: "monitoring_target", resourceId: target.id, metadata: { targetType: target.targetType, source: target.source } });
  return target;
}

export async function subscribeToMonitoring(input: unknown, actor: { userId: string; organisationId: string }) {
  const parsed = subscriptionInputSchema.parse(input);
  const [subscription] = await db.insert(monitoringSubscriptions).values({ id: uuidv7(), organisationId: actor.organisationId, userId: actor.userId, ...parsed }).onConflictDoUpdate({ target: [monitoringSubscriptions.organisationId, monitoringSubscriptions.userId, monitoringSubscriptions.subjectType, monitoringSubscriptions.subjectId], set: { eventTypes: parsed.eventTypes, channels: parsed.channels } }).returning();
  return subscription;
}

export async function enqueueEvent(input: { organisationId?: string; eventType: string; aggregateType: string; aggregateId: string; payload: Record<string, unknown>; deduplicationKey: string }) {
  const [event] = await db.insert(eventOutbox).values({ id: uuidv7(), ...input }).onConflictDoNothing({ target: [eventOutbox.eventType, eventOutbox.deduplicationKey] }).returning();
  return event ?? null;
}

export async function queueDueMonitoringRuns(now = new Date()) {
  const due = await db.select().from(monitoringTargets).where(and(eq(monitoringTargets.enabled, true), lte(monitoringTargets.nextCheckAt, now))).orderBy(asc(monitoringTargets.nextCheckAt)).limit(100);
  return db.transaction(async (tx) => {
    const created = [] as string[];
    for (const target of due) {
      const [claim] = await tx.update(monitoringTargets).set({ nextCheckAt: new Date(now.getTime() + target.intervalMinutes * 60_000), lastCheckedAt: now, updatedAt: now }).where(and(eq(monitoringTargets.id, target.id), lte(monitoringTargets.nextCheckAt, now))).returning({ id: monitoringTargets.id });
      if (!claim) continue;
      const id = uuidv7(); await tx.insert(monitoringRuns).values({ id, targetId: target.id }); created.push(id);
    }
    return created;
  });
}

export async function claimMonitoringRun(workerId: string, now = new Date()) {
  const leaseUntil = new Date(now.getTime() + 5 * 60_000);
  const candidates = await db.select({ id: monitoringRuns.id }).from(monitoringRuns).where(or(eq(monitoringRuns.status, "queued"), and(eq(monitoringRuns.status, "running"), lte(monitoringRuns.leaseExpiresAt, now)))).orderBy(asc(monitoringRuns.createdAt)).limit(1);
  if (!candidates[0]) return null;
  const [run] = await db.update(monitoringRuns).set({ status: "running", leaseExpiresAt: leaseUntil, startedAt: now, attempt: sql`${monitoringRuns.attempt} + 1` }).where(and(eq(monitoringRuns.id, candidates[0].id), or(eq(monitoringRuns.status, "queued"), and(eq(monitoringRuns.status, "running"), lte(monitoringRuns.leaseExpiresAt, now))))).returning();
  return run ? { ...run, workerId } : null;
}

export async function completeMonitoringRun(input: { runId: string; beforeState: Record<string, unknown>; afterState: Record<string, unknown>; error?: string }) {
  const [run] = await db.select().from(monitoringRuns).where(eq(monitoringRuns.id, input.runId)).limit(1); if (!run) throw new Error("Monitoring run not found");
  const now = new Date(); const failed = Boolean(input.error); const deadLetter = failed && run.attempt >= MAX_ATTEMPTS;
  const [updated] = await db.update(monitoringRuns).set({ status: deadLetter ? "dead_lettered" : failed ? "failed" : "succeeded", beforeState: input.beforeState, afterState: input.afterState, error: input.error, completedAt: now, leaseExpiresAt: null }).where(eq(monitoringRuns.id, input.runId)).returning();
  if (failed && !deadLetter) await db.update(monitoringRuns).set({ status: "queued", leaseExpiresAt: new Date(now.getTime() + retryDelay(run.attempt)), completedAt: null }).where(eq(monitoringRuns.id, input.runId));
  if (!failed && JSON.stringify(input.beforeState) !== JSON.stringify(input.afterState)) {
    const [target] = await db.select().from(monitoringTargets).where(eq(monitoringTargets.id, run.targetId)).limit(1);
    if (target) await enqueueEvent({ organisationId: target.organisationId, eventType: `monitoring.${target.targetType}.changed`, aggregateType: "monitoring_target", aggregateId: target.id, deduplicationKey: `${input.runId}:changed`, payload: { subjectType: target.subjectType, subjectId: target.subjectId, target: target.target, before: input.beforeState, after: input.afterState, runId: input.runId } });
  }
  return updated;
}

export async function claimOutboxEvent(now = new Date()) {
  const [candidate] = await db.select().from(eventOutbox).where(and(isNull(eventOutbox.processedAt), isNull(eventOutbox.deadLetteredAt), lte(eventOutbox.availableAt, now))).orderBy(asc(eventOutbox.availableAt)).limit(1); if (!candidate) return null;
  const [claimed] = await db.update(eventOutbox).set({ attempts: sql`${eventOutbox.attempts} + 1`, availableAt: new Date(now.getTime() + 5 * 60_000) }).where(and(eq(eventOutbox.id, candidate.id), isNull(eventOutbox.processedAt), isNull(eventOutbox.deadLetteredAt))).returning(); return claimed ?? null;
}

export async function completeOutboxEvent(input: { eventId: string; error?: string }) {
  const [event] = await db.select().from(eventOutbox).where(eq(eventOutbox.id, input.eventId)).limit(1); if (!event) throw new Error("Outbox event not found");
  const now = new Date();
  if (!input.error) return (await db.update(eventOutbox).set({ processedAt: now, lastError: null }).where(eq(eventOutbox.id, event.id)).returning())[0];
  const deadLetter = event.attempts >= MAX_ATTEMPTS;
  return (await db.update(eventOutbox).set({ lastError: input.error, deadLetteredAt: deadLetter ? now : null, availableAt: new Date(now.getTime() + retryDelay(event.attempts)) }).where(eq(eventOutbox.id, event.id)).returning())[0];
}

export async function listMonitoringTargets(organisationId: string) { return db.select().from(monitoringTargets).where(eq(monitoringTargets.organisationId, organisationId)).orderBy(asc(monitoringTargets.nextCheckAt)).limit(500); }
