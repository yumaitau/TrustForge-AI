import { calculateAndPersistTrustScore } from "@/lib/trust/service";
import { enqueueScoreDropAlert } from "@/lib/mobile/service";
import { deliverQueuedAlerts } from "@/lib/mobile/push";
import { claimMonitoringRun, claimOutboxEvent, completeMonitoringRun, completeOutboxEvent, getMonitoringTarget, latestObservedState, queueDueMonitoringRuns } from "./service";
import { noopExecutor, type MonitoringExecutor } from "./executor";

/** Connectors run in a separately deployed worker. The default executor never makes target-network calls. */
export async function runMonitoringTick(workerId = `in-process-${process.pid}`, executor: MonitoringExecutor = noopExecutor) {
  const queuedRunIds = await queueDueMonitoringRuns(); const run = await claimMonitoringRun(workerId);
  if (run) {
    const target = await getMonitoringTarget(run.targetId);
    const beforeState = (await latestObservedState(run.targetId, run.id)) ?? run.beforeState;
    if (!target) {
      await completeMonitoringRun({ runId: run.id, beforeState, afterState: beforeState, error: "Monitoring target no longer exists" });
    } else {
      try {
        const afterState = await executor({ run: { id: run.id, targetId: run.targetId }, target, beforeState });
        await completeMonitoringRun({ runId: run.id, beforeState, afterState });
      } catch (error) {
        await completeMonitoringRun({ runId: run.id, beforeState, afterState: beforeState, error: error instanceof Error ? error.message : "Monitoring executor failed" });
      }
    }
  }
  const event = await claimOutboxEvent();
  if (event) {
    try {
      const payload = event.payload as { subjectType?: "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api"; subjectId?: string };
      if (event.eventType.startsWith("monitoring.") && payload.subjectType && payload.subjectId) { await calculateAndPersistTrustScore(payload.subjectType, payload.subjectId); await enqueueScoreDropAlert(payload.subjectType, payload.subjectId); }
      await completeOutboxEvent({ eventId: event.id });
    } catch (error) { await completeOutboxEvent({ eventId: event.id, error: error instanceof Error ? error.message : "Unknown outbox consumer error" }); }
  }
  const pushDelivery = await deliverQueuedAlerts();
  return { queuedRunIds, claimedRunId: run?.id ?? null, claimedEventId: event?.id ?? null, pushDelivery };
}
