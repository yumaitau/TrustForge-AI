import { runMonitoringTick } from "./worker";

declare global { var trustForgeMonitoringTimer: ReturnType<typeof setInterval> | undefined; }

const MAX_TICK_ATTEMPTS = 3;

/** Exponential backoff (capped) between tick retries within a single scheduled interval. */
export function tickBackoffMs(attempt: number) {
  return Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt - 1));
}

export type MonitoringHealth = { lastSuccessAt: number | null; lastError: string | null; consecutiveFailures: number };
const health: MonitoringHealth = { lastSuccessAt: null, lastError: null, consecutiveFailures: 0 };

/** Snapshot of the in-process worker's health, so a stalled monitor is observable. */
export function monitoringHealth(): MonitoringHealth {
  return { ...health };
}

/**
 * Runs one monitoring tick with bounded retry and backoff. A transient failure (e.g. a
 * database blip) is retried instead of silently waiting a full interval, and repeated
 * failures are recorded on the health snapshot rather than crashing the timer.
 */
export async function runMonitoringTickWithRetry(options: { tick?: () => Promise<unknown>; sleep?: (ms: number) => Promise<void>; maxAttempts?: number } = {}) {
  const tick = options.tick ?? runMonitoringTick;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const maxAttempts = options.maxAttempts ?? MAX_TICK_ATTEMPTS;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await tick();
      health.lastSuccessAt = Date.now(); health.lastError = null; health.consecutiveFailures = 0;
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) await sleep(tickBackoffMs(attempt));
    }
  }
  health.consecutiveFailures += 1;
  health.lastError = lastError instanceof Error ? lastError.message : "Unknown monitoring tick error";
  console.error("TrustForge monitoring tick failed after retries", lastError);
  return null;
}

export function startInProcessMonitoring() {
  if (process.env.TRUSTFORGE_DISABLE_IN_PROCESS_WORKER === "true" || globalThis.trustForgeMonitoringTimer) return;
  const tick = () => void runMonitoringTickWithRetry();
  tick(); globalThis.trustForgeMonitoringTimer = setInterval(tick, 60_000); globalThis.trustForgeMonitoringTimer.unref?.();
}
