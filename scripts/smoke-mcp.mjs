import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const localBun = path.join(root, "node_modules", ".bin", "bun");
const bun = process.env.BUN ?? (existsSync(localBun) ? localBun : "bun");
const token = "mcp-ci-smoke-token";
const origin = "http://127.0.0.1:3100";
const server = spawn(bun, ["--bun", "mcp/http.ts"], { cwd: root, env: { ...process.env, MCP_HOST: "127.0.0.1", MCP_PORT: "3100", MCP_ALLOWED_HOSTS: "localhost,127.0.0.1", MCP_API_TOKEN: token }, stdio: ["ignore", "inherit", "inherit"] });

try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(`${origin}/health`)).ok) break; } catch { /* server is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (attempt === 49) throw new Error("MCP server did not become healthy");
  }
  const health = await (await fetch(`${origin}/health`)).json();
  if (health.status !== "ok" || health.service !== "trustforge-mcp") throw new Error(`Unexpected health payload: ${JSON.stringify(health)}`);
  const unauthorised = await fetch(`${origin}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) });
  if (unauthorised.status !== 401) throw new Error(`Expected 401 without bearer token, received ${unauthorised.status}`);
  const unauthorisedBody = await unauthorised.json();
  if (unauthorisedBody?.error?.code !== -32001) throw new Error(`Unexpected unauthorised body: ${JSON.stringify(unauthorisedBody)}`);
  const get = await fetch(`${origin}/mcp`);
  if (get.status !== 405) throw new Error(`Expected 405 for GET /mcp, received ${get.status}`);
  const del = await fetch(`${origin}/mcp`, { method: "DELETE" });
  if (del.status !== 405) throw new Error(`Expected 405 for DELETE /mcp, received ${del.status}`);
  const client = new Client({ name: "trustforge-ci", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name);
  for (const required of ["search_registry", "find_trustworthy_mcp_servers", "explain_trust_score", "compare_subjects"]) if (!names.includes(required)) throw new Error(`Missing MCP tool: ${required}`);
  const result = await client.callTool({ name: "search_registry", arguments: { query: "TrustForge", limit: 5 } });
  if (result.isError) throw new Error("MCP search tool returned an error");
  await client.close();
  console.log(`MCP smoke passed with ${names.length} tools`);
} finally {
  server.kill("SIGTERM");
}
