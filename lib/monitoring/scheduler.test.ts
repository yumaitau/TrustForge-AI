import { describe, expect, it } from "vitest";
import { monitoringHealth, runMonitoringTickWithRetry, tickBackoffMs } from "./scheduler";

const noSleep = async () => {};

describe("tickBackoffMs", () => {
  it("grows exponentially and is capped", () => {
    expect(tickBackoffMs(1)).toBe(1_000);
    expect(tickBackoffMs(2)).toBe(2_000);
    expect(tickBackoffMs(3)).toBe(4_000);
    expect(tickBackoffMs(20)).toBe(30_000);
  });
});

describe("runMonitoringTickWithRetry", () => {
  it("retries a transient failure and reports success", async () => {
    let calls = 0;
    const tick = async () => { calls += 1; if (calls < 2) throw new Error("db blip"); return { ok: true }; };
    const result = await runMonitoringTickWithRetry({ tick, sleep: noSleep });
    expect(result).toEqual({ ok: true });
    expect(calls).toBe(2);
    expect(monitoringHealth().consecutiveFailures).toBe(0);
    expect(monitoringHealth().lastSuccessAt).not.toBeNull();
  });

  it("gives up after maxAttempts and records the failure instead of throwing", async () => {
    let calls = 0;
    const tick = async () => { calls += 1; throw new Error("still down"); };
    const result = await runMonitoringTickWithRetry({ tick, sleep: noSleep, maxAttempts: 3 });
    expect(result).toBeNull();
    expect(calls).toBe(3);
    expect(monitoringHealth().lastError).toBe("still down");
    expect(monitoringHealth().consecutiveFailures).toBeGreaterThanOrEqual(1);
  });
});
