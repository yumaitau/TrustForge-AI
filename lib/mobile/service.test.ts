import { describe, expect, it } from "vitest";
import { DEVICE_LIMIT_PER_USER, overflowDeviceIds } from "./service";

describe("overflowDeviceIds", () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `device-${i}`);

  it("keeps everything while under the cap", () => {
    expect(overflowDeviceIds(ids(3))).toEqual([]);
    expect(overflowDeviceIds(ids(DEVICE_LIMIT_PER_USER))).toEqual([]);
  });

  it("evicts the least-recently-seen devices beyond the cap", () => {
    const ordered = ids(DEVICE_LIMIT_PER_USER + 2);
    expect(overflowDeviceIds(ordered)).toEqual([`device-${DEVICE_LIMIT_PER_USER}`, `device-${DEVICE_LIMIT_PER_USER + 1}`]);
  });

  it("respects a custom limit", () => {
    expect(overflowDeviceIds(["a", "b", "c"], 1)).toEqual(["b", "c"]);
  });
});
