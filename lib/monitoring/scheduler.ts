import { runMonitoringTick } from "./worker";

declare global { var trustForgeMonitoringTimer: ReturnType<typeof setInterval> | undefined; }

export function startInProcessMonitoring() {
  if (process.env.TRUSTFORGE_DISABLE_IN_PROCESS_WORKER === "true" || globalThis.trustForgeMonitoringTimer) return;
  const tick = () => void runMonitoringTick().catch((error) => console.error("TrustForge monitoring tick failed", error));
  tick(); globalThis.trustForgeMonitoringTimer = setInterval(tick, 60_000); globalThis.trustForgeMonitoringTimer.unref?.();
}
