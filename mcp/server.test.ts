import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { createTrustForgeMcpServer, type TrustForgeMcpServices } from "./server";

const services: TrustForgeMcpServices = {
  async search({ query }) { return [{ id: "subject-1", name: `${query} result`, type: "model", verificationLevel: "organisation_verified", trustScore: 82, evidenceIds: ["evidence-1"] }]; },
  async findMcp() { return [{ id: "mcp-1", name: "Safe MCP", trustScore: 91, permissionRisk: { level: "low", score: 0, findings: [] } }]; },
  async getScore({ subjectId }) { return { subjectId, score: 82, confidence: 0.75, evidenceIds: ["evidence-1"] }; },
};

let client: Client | undefined;
let server: ReturnType<typeof createTrustForgeMcpServer> | undefined;
afterEach(async () => { await client?.close(); await server?.close(); client = undefined; server = undefined; });

describe("TrustForge MCP server", () => {
  it("advertises read-only trust tools and returns structured cited results", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "1.0.0" }); server = createTrustForgeMcpServer(services);
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(["search_registry", "find_trustworthy_mcp_servers", "explain_trust_score", "compare_subjects"]));
    expect(tools.tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
    const result = await client.callTool({ name: "search_registry", arguments: { query: "Claude", limit: 5 } });
    expect(JSON.stringify(result.structuredContent)).toContain("evidence-1");
  });
});
