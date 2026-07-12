import { calculateAndPersistTrustScore } from "@/lib/trust/service";
import { enqueueScoreDropAlert } from "@/lib/mobile/service";
import { claimMonitoringRun, claimOutboxEvent, completeMonitoringRun, completeOutboxEvent, queueDueMonitoringRuns } from "./service";

/** Connectors run in a separately deployed worker. The default executor never makes target-network calls. */
export async function runMonitoringTick(workerId = `in-process-${process.pid}`) {
  const queuedRunIds = await queueDueMonitoringRuns(); const run = await claimMonitoringRun(workerId);
  if (run) await completeMonitoringRun({ runId: run.id, beforeState: run.beforeState, afterState: run.beforeState });
  const event = await claimOutboxEvent();
  if (event) {
    try {
      const payload = event.payload as { subjectType?: "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api"; subjectId?: string };
      if (event.eventType.startsWith("monitoring.") && payload.subjectType && payload.subjectId) { await calculateAndPersistTrustScore(payload.subjectType, payload.subjectId); await enqueueScoreDropAlert(payload.subjectType, payload.subjectId); }
      await completeOutboxEvent({ eventId: event.id });
    } catch (error) { await completeOutboxEvent({ eventId: event.id, error: error instanceof Error ? error.message : "Unknown outbox consumer error" }); }
  }
  return { queuedRunIds, claimedRunId: run?.id ?? null, claimedEventId: event?.id ?? null };
}
