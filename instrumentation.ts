export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startInProcessMonitoring } = await import("@/lib/monitoring/scheduler");
    startInProcessMonitoring();
  }
}
