import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

function privateAddress(address: string) {
  return address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80") || address.startsWith("127.") || address.startsWith("10.") || address.startsWith("192.168.") || address.startsWith("169.254.") || /^172\.(1[6-9]|2\d|3[01])\./.test(address);
}

export async function assertSafeMcpUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" && process.env.ALLOW_INSECURE_MCP_INSPECTION !== "true") throw new Error("Remote MCP inspection requires HTTPS");
  if (isIP(url.hostname) && privateAddress(url.hostname)) throw new Error("Private and loopback MCP targets are blocked");
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some((item) => privateAddress(item.address))) throw new Error("MCP hostname resolves to a private or loopback address");
  return url;
}

export async function inspectRemoteMcpServer(rawUrl: string, bearerToken?: string) {
  const url = await assertSafeMcpUrl(rawUrl);
  const client = new Client({ name: "trustforge-inspector", version: "0.3.0" });
  const transport = new StreamableHTTPClientTransport(url, { requestInit: bearerToken ? { headers: { Authorization: `Bearer ${bearerToken}` } } : undefined });
  try {
    await client.connect(transport);
    const [tools, resources, prompts] = await Promise.all([client.listTools(), client.listResources(), client.listPrompts()]);
    return { tools: tools.tools, resources: resources.resources, prompts: prompts.prompts, inspectedAt: new Date().toISOString() };
  } finally { await client.close(); }
}
