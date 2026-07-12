import { describe, expect, it } from "vitest";
import { assertSafeRemoteUrl } from "./remote";

describe("security remote fetch guard", () => {
  it("rejects insecure URLs, credentials, ports, and unapproved hosts before network access", async () => {
    await expect(assertSafeRemoteUrl("http://api.osv.dev/v1/vulns/X", ["api.osv.dev"])).rejects.toThrow("HTTPS");
    await expect(assertSafeRemoteUrl("https://user:password@api.osv.dev/v1/vulns/X", ["api.osv.dev"])).rejects.toThrow("credential-free");
    await expect(assertSafeRemoteUrl("https://example.com/v1", ["api.osv.dev"])).rejects.toThrow("approved source");
  });
  it("rejects loopback targets", async () => { await expect(assertSafeRemoteUrl("https://127.0.0.1/v1", [])).rejects.toThrow("private, loopback"); });
});
