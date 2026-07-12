import { buildSchema, graphql } from "graphql";
import { listCompanies, listProducts } from "@/lib/registry/repository";
import { listMcpServers } from "@/lib/ecosystem/repository";
import { scoreHistory } from "@/lib/trust/service";
import { listFindings } from "@/lib/security/intelligence";

export const trustForgeGraphqlSchema = buildSchema(`
  enum SubjectType { company product mcp_server skill agent model api }
  type SearchResult { id: ID!, name: String!, type: SubjectType!, verificationLevel: String!, description: String }
  type PermissionRisk { level: String!, score: Int!, findings: [String!]! }
  type McpServer { id: ID!, productId: ID!, name: String!, slug: String!, trustScore: Float, verificationLevel: String!, transports: [String!]!, enterpriseReady: Boolean!, sandboxCompatible: Boolean!, permissionRisk: PermissionRisk! }
  type TrustScore { id: ID!, score: Float!, methodologyVersion: String!, calculatedAt: String!, explanation: String! }
  type SecurityFinding { id: ID!, title: String!, severity: String!, status: String!, scanner: String!, affectedComponent: String, remediation: String }
  type Query {
    search(query: String!, type: SubjectType, limit: Int = 20): [SearchResult!]!
    mcpServers(query: String, transport: String, enterpriseReady: Boolean, sandboxCompatible: Boolean, limit: Int = 20): [McpServer!]!
    trustScore(subjectType: SubjectType!, subjectId: ID!): TrustScore
    securityFindings(subjectType: SubjectType!, subjectId: ID!): [SecurityFinding!]!
  }
`);

const rootValue = {
  async search({ query, type, limit }: { query: string; type?: string; limit: number }) {
    const [companies, products] = await Promise.all([type && type !== "company" ? Promise.resolve({ items: [] }) : listCompanies({ query, limit }), type === "company" ? Promise.resolve({ items: [] }) : listProducts({ query, limit })]);
    return [...companies.items.map((item) => ({ id: item.id, name: item.displayName, type: "company", verificationLevel: item.verificationLevel, description: item.description })), ...products.items.filter((item) => !type || item.type === type).map((item) => ({ id: item.id, name: item.name, type: item.type, verificationLevel: item.verificationLevel, description: item.description }))].slice(0, Math.min(limit, 100));
  },
  async mcpServers(input: { query?: string; transport?: string; enterpriseReady?: boolean; sandboxCompatible?: boolean; limit: number }) {
    const transport = input.transport === "stdio" || input.transport === "http" || input.transport === "websocket" ? input.transport : undefined;
    return listMcpServers({ ...input, transport });
  },
  async trustScore({ subjectType, subjectId }: { subjectType: "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api"; subjectId: string }) {
    const [score] = await scoreHistory(subjectType, subjectId, 1); if (!score) return null;
    return { ...score, score: Number(score.score), calculatedAt: score.calculatedAt.toISOString(), explanation: JSON.stringify(score.explanation) };
  },
  async securityFindings({ subjectType, subjectId }: { subjectType: "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api"; subjectId: string }) { return listFindings(subjectType, subjectId); },
};

export function executeGraphql(input: { source: string; variableValues?: Record<string, unknown>; operationName?: string }) {
  return graphql({ schema: trustForgeGraphqlSchema, rootValue, ...input });
}
