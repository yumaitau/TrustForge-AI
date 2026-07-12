import { describe, expect, it } from "vitest";
import { assertSafeMcpUrl } from "./client";

describe("remote MCP inspection", () => {
  it("blocks insecure and loopback targets before connecting", async () => {
    await expect(assertSafeMcpUrl("http://example.com/mcp")).rejects.toThrow(/HTTPS/);
    await expect(assertSafeMcpUrl("https://127.0.0.1/mcp")).rejects.toThrow(/blocked/);
  });
});
