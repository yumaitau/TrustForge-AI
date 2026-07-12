import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const token = "mcp-ci-smoke-token";
const server = spawn(process.execPath, ["dist/mcp/http.js"], { env: { ...process.env, MCP_HOST: "127.0.0.1", MCP_PORT: "3100", MCP_API_TOKEN: token }, stdio: ["ignore", "inherit", "inherit"] });

try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch("http://127.0.0.1:3100/health")).ok) break; } catch { /* server is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (attempt === 49) throw new Error("MCP server did not become healthy");
  }
  const client = new Client({ name: "trustforge-ci", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3100/mcp"), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
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
