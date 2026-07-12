import { and, eq, inArray } from "drizzle-orm";
import { mobileDevices, trustAlerts } from "@/db/schema";
import { db } from "@/lib/db/client";

export type PushMessage = { to: string; title: string; body: string; data: { alertId: string; subjectType: string; subjectId: string; kind: string } };
export type PushProvider = { name: string; send(messages: PushMessage[]): Promise<{ delivered: number; failed: number }> };

const GENERIC_TITLES: Record<string, string> = {
  score_drop: "Trust score changed",
  new_finding: "New security finding",
  verification_change: "Verification level changed",
};

/**
 * Push payloads are content-free by policy (docs/mobile.md): a generic title,
 * a generic body, and subject references only. Registry names, finding titles,
 * scores, and severities never travel through third-party push infrastructure;
 * the app fetches details over the authenticated API on open.
 */
export function buildPushMessage(alert: { id: string; subjectType: string; subjectId: string; kind: string }, pushToken: string): PushMessage {
  return {
    to: pushToken,
    title: GENERIC_TITLES[alert.kind] ?? "Trust alert",
    body: "Open TrustForge to review the change for a subject you follow.",
    data: { alertId: alert.id, subjectType: alert.subjectType, subjectId: alert.subjectId, kind: alert.kind },
  };
}

/** Delivers through Expo's push service, which fans out to APNs and FCM. */
export const expoPushProvider: PushProvider = {
  name: "expo",
  async send(messages) {
    if (messages.length === 0) return { delivered: 0, failed: 0 };
    let delivered = 0;
    let failed = 0;
    for (let start = 0; start < messages.length; start += 100) {
      const chunk = messages.slice(start, start + 100);
      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(chunk) });
        const body = (await response.json().catch(() => null)) as { data?: { status: string }[] } | null;
        const statuses = body?.data ?? [];
        delivered += statuses.filter((ticket) => ticket.status === "ok").length;
        failed += chunk.length - statuses.filter((ticket) => ticket.status === "ok").length;
      } catch {
        failed += chunk.length;
      }
    }
    return { delivered, failed };
  },
};

/** Used when push delivery is not configured; alerts stay readable in-app. */
export const noopPushProvider: PushProvider = {
  name: "noop",
  async send(messages) { return { delivered: 0, failed: messages.length }; },
};

export function resolvePushProvider(): PushProvider {
  return process.env.PUSH_PROVIDER === "expo" ? expoPushProvider : noopPushProvider;
}

/**
 * Delivery step for the queued alert outbox. Queued alerts fan out to each of
 * the user's push-enabled devices; alerts are marked sent when at least one
 * message is accepted and failed only when a provider is configured and every
 * message for the alert is rejected. Without a configured provider alerts stay
 * queued so the in-app inbox remains the source of truth.
 */
export async function deliverQueuedAlerts(provider: PushProvider = resolvePushProvider(), limit = 200) {
  const queued = await db.select().from(trustAlerts).where(eq(trustAlerts.status, "queued")).limit(Math.min(Math.max(limit, 1), 500));
  if (queued.length === 0 || provider.name === "noop") return { attempted: 0, delivered: 0, failed: 0 };
  const userIds = [...new Set(queued.map((alert) => alert.userId))];
  const devices = await db.select().from(mobileDevices).where(and(inArray(mobileDevices.userId, userIds), eq(mobileDevices.pushEnabled, true)));
  const devicesByUser = new Map<string, typeof devices>();
  for (const device of devices) devicesByUser.set(device.userId, [...(devicesByUser.get(device.userId) ?? []), device]);
  let delivered = 0;
  let failed = 0;
  for (const alert of queued) {
    const targets = devicesByUser.get(alert.userId) ?? [];
    if (targets.length === 0) continue; // No registered device; alert stays queued for the in-app inbox.
    const result = await provider.send(targets.map((device) => buildPushMessage(alert, device.pushToken)));
    if (result.delivered > 0) {
      delivered += 1;
      await db.update(trustAlerts).set({ status: "sent", sentAt: new Date() }).where(eq(trustAlerts.id, alert.id));
    } else {
      failed += 1;
      await db.update(trustAlerts).set({ status: "failed" }).where(eq(trustAlerts.id, alert.id));
    }
  }
  return { attempted: queued.length, delivered, failed };
}
