import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createTrustForgeMcpServer } from "./server";

const server = createTrustForgeMcpServer();
await server.connect(new StdioServerTransport());
console.error("TrustForge MCP server running on stdio");

process.on("SIGINT", async () => { await server.close(); process.exit(0); });
