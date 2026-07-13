/**
 * Monitoring execution seam. Connectors that make target-network calls run in a
 * separately deployed worker and inject their own executor. The default executor
 * observes nothing, so the observed `afterState` equals the prior `beforeState`
 * and no spurious change events are emitted.
 */
export type MonitoringRunContext = {
  run: { id: string; targetId: string };
  target: { id: string; targetType: string; target: string; source: string; configuration: Record<string, unknown> };
  beforeState: Record<string, unknown>;
};

/** Returns the freshly observed state of the target. */
export type MonitoringExecutor = (context: MonitoringRunContext) => Promise<Record<string, unknown>>;

/** The default executor performs no observation and reports the target unchanged. */
export const noopExecutor: MonitoringExecutor = async (context) => context.beforeState;

/** Structural change detection used to decide whether a run emits a change event. */
export function hasStateChanged(before: Record<string, unknown>, after: Record<string, unknown>) {
  return JSON.stringify(before) !== JSON.stringify(after);
}
