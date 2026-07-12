import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const isPrivateAddress = (address: string) => {
  if (net.isIP(address) === 4) { const [a, b] = address.split(".").map(Number); return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168); }
  const value = address.toLowerCase(); return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:") || value.startsWith("::ffff:127.") || value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.");
};

export async function assertSafeRemoteUrl(raw: string, allowHosts: readonly string[] = []) {
  const url = new URL(raw); if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Only credential-free HTTPS endpoints on port 443 are permitted");
  if (allowHosts.length && !allowHosts.includes(url.hostname)) throw new Error("Remote host is not an approved source");
  const records = await lookup(url.hostname, { all: true, verbatim: true }); if (!records.length || records.some((record) => isPrivateAddress(record.address))) throw new Error("Remote host resolves to a private, loopback, or unsupported address");
  return url;
}

export async function safeRemoteJson<T>(raw: string, options: { allowHosts: readonly string[]; method?: "GET" | "POST"; body?: string; headers?: Record<string, string>; signal?: AbortSignal } ): Promise<T> {
  let url = await assertSafeRemoteUrl(raw, options.allowHosts);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(url, { method: options.method ?? "GET", body: options.body, headers: { accept: "application/json", ...options.headers }, redirect: "manual", signal: options.signal });
    if (response.status >= 300 && response.status < 400) { const location = response.headers.get("location"); if (!location) throw new Error("Remote source sent a redirect without a location"); url = await assertSafeRemoteUrl(new URL(location, url).toString(), options.allowHosts); continue; }
    if (!response.ok) throw new Error(`Remote source failed with HTTP ${response.status}`);
    const length = Number(response.headers.get("content-length") ?? 0); if (length > MAX_RESPONSE_BYTES) throw new Error("Remote response exceeded the 2 MiB safety limit");
    const text = await response.text(); if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new Error("Remote response exceeded the 2 MiB safety limit"); return JSON.parse(text) as T;
  }
  throw new Error("Remote source exceeded the redirect limit");
}
