import { describe, expect, it } from "vitest";
import { hasStateChanged, noopExecutor, type MonitoringRunContext } from "./executor";

const context = (before: Record<string, unknown>): MonitoringRunContext => ({
  run: { id: "run-1", targetId: "target-1" },
  target: { id: "target-1", targetType: "endpoint", target: "https://example.test", source: "http", configuration: {} },
  beforeState: before,
});

describe("hasStateChanged", () => {
  it("reports no change for structurally equal states", () => {
    expect(hasStateChanged({ etag: "a", size: 1 }, { etag: "a", size: 1 })).toBe(false);
    expect(hasStateChanged({}, {})).toBe(false);
  });

  it("reports a change when any observed field differs", () => {
    expect(hasStateChanged({ etag: "a" }, { etag: "b" })).toBe(true);
    expect(hasStateChanged({ etag: "a" }, { etag: "a", added: true })).toBe(true);
  });
});

describe("noopExecutor", () => {
  it("echoes beforeState so an unobserved run never emits a change event", async () => {
    const before = { etag: "a", size: 1 };
    const after = await noopExecutor(context(before));
    expect(after).toEqual(before);
    expect(hasStateChanged(before, after)).toBe(false);
  });

  it("lets an injected executor surface a real change", async () => {
    const changingExecutor = async () => ({ etag: "b" });
    const after = await changingExecutor();
    expect(hasStateChanged({ etag: "a" }, after)).toBe(true);
  });
});
