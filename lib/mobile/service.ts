import { and, desc, eq, inArray } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { alertPreferences, mobileDevices, mobileFavorites, trustAlerts } from "@/db/schema";
import { db } from "@/lib/db/client";
import { scoreHistory } from "@/lib/trust/service";
import { alertMatchesPreference, ALERT_KINDS, type TrustChangeEvent } from "./alerts";

const subjectTypes = ["company", "product", "mcp_server", "skill", "agent", "model", "api"] as const;
const subject = z.object({ subjectType: z.enum(subjectTypes), subjectId: z.uuid() });

export const deviceSchema = z.object({ platform: z.enum(["ios", "android"]), pushToken: z.string().min(8).max(512), deviceName: z.string().max(120).optional(), appVersion: z.string().max(40).optional(), pushEnabled: z.boolean().default(true) });
export const preferenceSchema = subject.extend({ scoreDrops: z.boolean().default(true), newFindings: z.boolean().default(true), verificationChanges: z.boolean().default(false), minSeverity: z.enum(["unknown", "none", "low", "medium", "high", "critical"]).default("high") });
export const favoriteSchema = subject.extend({ label: z.string().max(120).optional() });
export const trustChangeEventSchema = subject.extend({ kind: z.enum(ALERT_KINDS), scoreDelta: z.number().optional(), severity: z.enum(["unknown", "none", "low", "medium", "high", "critical"]).optional() });

export const DEVICE_LIMIT_PER_USER = 10;

/** Device ids beyond the per-user cap, given ids ordered most-recently-seen first. */
export function overflowDeviceIds(orderedNewestFirst: string[], limit = DEVICE_LIMIT_PER_USER) {
  return orderedNewestFirst.slice(limit);
}

export async function registerDevice(input: unknown, userId: string) {
  const parsed = deviceSchema.parse(input);
  const now = new Date();
  const [device] = await db.insert(mobileDevices).values({ id: uuidv7(), userId, lastSeenAt: now, ...parsed })
    .onConflictDoUpdate({ target: [mobileDevices.userId, mobileDevices.pushToken], set: { platform: parsed.platform, deviceName: parsed.deviceName, appVersion: parsed.appVersion, pushEnabled: parsed.pushEnabled, lastSeenAt: now } }).returning();
  // Cap devices per user, evicting the least-recently-seen, so one account cannot register
  // unbounded devices and make push fan-out O(n).
  const owned = await db.select({ id: mobileDevices.id }).from(mobileDevices).where(eq(mobileDevices.userId, userId)).orderBy(desc(mobileDevices.lastSeenAt));
  const stale = overflowDeviceIds(owned.map((row) => row.id));
  if (stale.length) await db.delete(mobileDevices).where(and(eq(mobileDevices.userId, userId), inArray(mobileDevices.id, stale)));
  return device;
}

export async function removeDevice(id: string, userId: string) {
  const removed = await db.delete(mobileDevices).where(and(eq(mobileDevices.id, id), eq(mobileDevices.userId, userId))).returning();
  if (removed.length === 0) throw new Error("Device not found");
  return removed[0];
}

export async function upsertAlertPreference(input: unknown, userId: string) {
  const parsed = preferenceSchema.parse(input);
  const [preference] = await db.insert(alertPreferences).values({ id: uuidv7(), userId, ...parsed })
    .onConflictDoUpdate({ target: [alertPreferences.userId, alertPreferences.subjectType, alertPreferences.subjectId], set: { scoreDrops: parsed.scoreDrops, newFindings: parsed.newFindings, verificationChanges: parsed.verificationChanges, minSeverity: parsed.minSeverity, updatedAt: new Date() } }).returning();
  return preference;
}

export async function listAlertPreferences(userId: string) {
  return db.select().from(alertPreferences).where(eq(alertPreferences.userId, userId)).limit(200);
}

export async function addFavorite(input: unknown, userId: string) {
  const parsed = favoriteSchema.parse(input);
  const [favorite] = await db.insert(mobileFavorites).values({ id: uuidv7(), userId, ...parsed })
    .onConflictDoUpdate({ target: [mobileFavorites.userId, mobileFavorites.subjectType, mobileFavorites.subjectId], set: { label: parsed.label } }).returning();
  return favorite;
}

export async function removeFavorite(id: string, userId: string) {
  const removed = await db.delete(mobileFavorites).where(and(eq(mobileFavorites.id, id), eq(mobileFavorites.userId, userId))).returning();
  if (removed.length === 0) throw new Error("Favorite not found");
  return removed[0];
}

export async function listFavorites(userId: string) {
  return db.select().from(mobileFavorites).where(eq(mobileFavorites.userId, userId)).orderBy(desc(mobileFavorites.createdAt)).limit(200);
}

/**
 * Fans a trust-change event out to every user whose preference matches.
 * Called by the monitoring worker when scores drop, findings appear, or
 * verification levels change. Alerts are queued; delivery is a separate step.
 */
export async function enqueueTrustAlerts(input: unknown) {
  const event = trustChangeEventSchema.parse(input) as TrustChangeEvent & { subjectType: (typeof subjectTypes)[number]; subjectId: string };
  const preferences = await db.select().from(alertPreferences).where(and(eq(alertPreferences.subjectType, event.subjectType), eq(alertPreferences.subjectId, event.subjectId))).limit(10_000);
  const matching = preferences.filter((preference) => alertMatchesPreference(preference, event));
  if (matching.length === 0) return [];
  return db.insert(trustAlerts).values(matching.map((preference) => ({ id: uuidv7(), userId: preference.userId, subjectType: event.subjectType, subjectId: event.subjectId, kind: event.kind, payload: { scoreDelta: event.scoreDelta, severity: event.severity } }))).returning();
}

/** Called after a score is persisted; alerts fire only when the score decreased. */
export async function enqueueScoreDropAlert(subjectType: (typeof subjectTypes)[number], subjectId: string) {
  const history = await scoreHistory(subjectType, subjectId, 2);
  if (history.length < 2) return [];
  const delta = Number(history[0].score) - Number(history[1].score);
  if (delta >= 0) return [];
  return enqueueTrustAlerts({ subjectType, subjectId, kind: "score_drop", scoreDelta: Number(delta.toFixed(2)) });
}

export async function pendingAlerts(userId: string, limit = 100) {
  return db.select().from(trustAlerts).where(and(eq(trustAlerts.userId, userId), eq(trustAlerts.status, "queued"))).orderBy(desc(trustAlerts.createdAt)).limit(Math.min(Math.max(limit, 1), 200));
}

export async function acknowledgeAlerts(ids: string[], userId: string) {
  const parsed = z.array(z.uuid()).min(1).max(200).parse(ids);
  const updated = [];
  for (const id of parsed) {
    const rows = await db.update(trustAlerts).set({ status: "sent", sentAt: new Date() }).where(and(eq(trustAlerts.id, id), eq(trustAlerts.userId, userId))).returning();
    updated.push(...rows);
  }
  return updated;
}
