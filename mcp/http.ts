import { timingSafeEqual } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTrustForgeMcpServer } from "./server";

const host = process.env.MCP_HOST ?? "127.0.0.1";
const allowedHosts = (process.env.MCP_ALLOWED_HOSTS ?? "localhost,127.0.0.1").split(",").map((item) => item.trim()).filter(Boolean);
const app = createMcpExpressApp({ host, allowedHosts });
const port = Number(process.env.MCP_PORT ?? 3100);

function authorised(header: string | undefined) {
  const expected = process.env.MCP_API_TOKEN;
  if (!expected && process.env.NODE_ENV !== "production") return true;
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7)); const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

app.get("/health", (_request, response) => response.json({ status: "ok", service: "trustforge-mcp" }));
app.post("/mcp", async (request, response) => {
  if (!authorised(request.header("authorization"))) { response.status(401).json({ jsonrpc: "2.0", error: { code: -32001, message: "Authentication required" }, id: null }); return; }
  const server = createTrustForgeMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  response.on("close", () => { void transport.close(); void server.close(); });
  await server.connect(transport);
  await transport.handleRequest(request, response, request.body);
});
app.get("/mcp", (_request, response) => response.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Use POST for stateless Streamable HTTP." }, id: null }));
app.delete("/mcp", (_request, response) => response.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Stateless sessions cannot be deleted." }, id: null }));

app.listen(port, host, () => console.error(`TrustForge MCP listening on http://${host}:${port}/mcp`));
