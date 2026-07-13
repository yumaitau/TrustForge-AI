import { and, asc, desc, eq, gt, ilike, isNull, or, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { agents, apiOfferings, mcpDependencies, mcpReleases, mcpServers, models, products, skills, trustScores } from "@/db/schema";
import { db } from "@/lib/db/client";
import { canonicalSlug } from "@/lib/registry/schemas";
import type { AgentInput, ApiOfferingInput, McpServerInput, ModelInput, SkillInput } from "./schemas";
import { assessPermissionRisk } from "./permissions";

const commonProduct = (input: { name: string; description?: string; websiteUrl?: string; repositoryUrl?: string; openSource: boolean; companyId?: string }, type: "mcp_server" | "skill" | "agent" | "model" | "api") => {
  const id = uuidv7();
  return { id, companyId: input.companyId, name: input.name, slug: canonicalSlug(input.name, id), type, description: input.description, websiteUrl: input.websiteUrl, repositoryUrl: input.repositoryUrl, openSource: input.openSource } as const;
};

export async function createMcpServer(input: McpServerInput) {
  const product = commonProduct(input, "mcp_server");
  return db.transaction(async (tx) => {
    const [productRow] = await tx.insert(products).values(product).returning();
    const [profile] = await tx.insert(mcpServers).values({ id: uuidv7(), productId: product.id, publisherCompanyId: input.companyId, maintainer: input.maintainer, repositoryUrl: input.repositoryUrl, documentationUrl: input.documentationUrl, packageIdentifier: input.packageIdentifier, transports: input.transports, permissions: input.permissions, authenticationMethods: input.authenticationMethods, secretsRequired: input.secretsRequired, oauthSupported: input.oauthSupported, sandboxCompatible: input.sandboxCompatible, enterpriseReady: input.enterpriseReady, maintenanceStatus: input.maintenanceStatus }).returning();
    return { product: productRow, profile, permissionRisk: assessPermissionRisk(input.permissions) };
  });
}

export async function listMcpServers(input: { query?: string; transport?: "stdio" | "http" | "websocket"; enterpriseReady?: boolean; sandboxCompatible?: boolean; limit?: number } = {}) {
  const filters = [isNull(products.deletedAt), eq(products.type, "mcp_server")];
  if (input.query) filters.push(ilike(products.name, `%${input.query}%`));
  if (input.enterpriseReady !== undefined) filters.push(eq(mcpServers.enterpriseReady, input.enterpriseReady));
  if (input.sandboxCompatible !== undefined) filters.push(eq(mcpServers.sandboxCompatible, input.sandboxCompatible));
  if (input.transport) filters.push(sql`${input.transport} = any(${mcpServers.transports})`);
  const rows = await db.select({
    id: mcpServers.id, productId: products.id, slug: products.slug, name: products.name, description: products.description,
    verificationLevel: products.verificationLevel, openSource: products.openSource, transports: mcpServers.transports,
    permissions: mcpServers.permissions, oauthSupported: mcpServers.oauthSupported, sandboxCompatible: mcpServers.sandboxCompatible,
    enterpriseReady: mcpServers.enterpriseReady, maintenanceStatus: mcpServers.maintenanceStatus, repositoryUrl: mcpServers.repositoryUrl,
    trustScore: sql<string | null>`(select ${trustScores.score} from ${trustScores} where ${trustScores.subjectType} = 'mcp_server' and ${trustScores.subjectId} = ${products.id} order by ${trustScores.calculatedAt} desc limit 1)`,
  }).from(mcpServers).innerJoin(products, eq(products.id, mcpServers.productId)).where(and(...filters)).orderBy(desc(products.updatedAt)).limit(Math.min(Math.max(input.limit ?? 50, 1), 100));
  return rows.map((row) => ({ ...row, trustScore: row.trustScore === null ? null : Number(row.trustScore), permissionRisk: assessPermissionRisk(row.permissions) }));
}

export async function createSkill(input: SkillInput) { const product = commonProduct(input, "skill"); return db.transaction(async (tx) => { const [productRow] = await tx.insert(products).values(product).returning(); const [profile] = await tx.insert(skills).values({ id: uuidv7(), productId: product.id, format: input.format, version: input.version, manifest: input.manifest, capabilities: input.capabilities, permissions: input.permissions, compatibleHosts: input.compatibleHosts }).returning(); return { product: productRow, profile, permissionRisk: assessPermissionRisk(input.permissions) }; }); }
export async function createAgent(input: AgentInput) { const product = commonProduct(input, "agent"); return db.transaction(async (tx) => { const [productRow] = await tx.insert(products).values(product).returning(); const [profile] = await tx.insert(agents).values({ id: uuidv7(), productId: product.id, capabilities: input.capabilities, permissions: input.permissions, autonomyLevel: input.autonomyLevel, deploymentModes: input.deploymentModes, modelDependencies: input.modelDependencies }).returning(); return { product: productRow, profile, permissionRisk: assessPermissionRisk(input.permissions) }; }); }
export async function createModel(input: ModelInput) { const product = commonProduct(input, "model"); return db.transaction(async (tx) => { const [productRow] = await tx.insert(products).values(product).returning(); const [profile] = await tx.insert(models).values({ id: uuidv7(), productId: product.id, family: input.family, providerModelId: input.providerModelId, modalities: input.modalities, contextWindow: input.contextWindow, openWeights: input.openWeights, license: input.license, trainingDataSummary: input.trainingDataSummary, safetyDocumentationUrl: input.safetyDocumentationUrl }).returning(); return { product: productRow, profile }; }); }
export async function createApiOffering(input: ApiOfferingInput) { const product = commonProduct(input, "api"); return db.transaction(async (tx) => { const [productRow] = await tx.insert(products).values(product).returning(); const [profile] = await tx.insert(apiOfferings).values({ id: uuidv7(), productId: product.id, baseUrl: input.baseUrl, authenticationMethods: input.authenticationMethods, protocols: input.protocols, dataResidencyRegions: input.dataResidencyRegions, retentionSummary: input.retentionSummary, trainingUsage: input.trainingUsage, slaUrl: input.slaUrl, pricingUrl: input.pricingUrl }).returning(); return { product: productRow, profile }; }); }

export type EcosystemType = "skill" | "agent" | "model" | "api";
const ecosystemProfileTables = { skill: skills, agent: agents, model: models, api: apiOfferings } as const;
const boundedLimit = (limit?: number) => Math.min(Math.max(limit ?? 20, 1), 100);

/** Cursor-paginated (by id) ecosystem list, matching the company/product registry contract. */
export async function listEcosystemProfiles(type: EcosystemType, input: { query?: string; cursor?: string; limit?: number } = {}) {
  const filters = [eq(products.type, type), isNull(products.deletedAt)];
  if (input.cursor) filters.push(gt(products.id, input.cursor));
  if (input.query) filters.push(ilike(products.name, `%${input.query}%`));
  const limit = boundedLimit(input.limit);
  const rows = await db.select().from(products).where(and(...filters)).orderBy(asc(products.id)).limit(limit + 1);
  return { items: rows.slice(0, limit), nextCursor: rows.length > limit ? rows[limit - 1]?.id ?? null : null };
}

/** Fetches a single ecosystem subject with its typed profile by id or slug. */
export async function getEcosystemProfile(type: EcosystemType, idOrSlug: string) {
  const [product] = await db.select().from(products).where(and(eq(products.type, type), isNull(products.deletedAt), or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug)))).limit(1);
  if (!product) return null;
  const table = ecosystemProfileTables[type];
  const [profile] = await db.select().from(table).where(eq(table.productId, product.id)).limit(1);
  return { product, profile: profile ?? null };
}

export async function addMcpRelease(input: { mcpServerId: string; version: string; releaseUrl?: string; commitSha?: string; signatureVerified?: boolean; sbomUrl?: string; publishedAt: Date }) {
  const [release] = await db.insert(mcpReleases).values({ id: uuidv7(), ...input }).returning(); return release;
}
export async function listMcpReleases(mcpServerId: string) { return db.select().from(mcpReleases).where(eq(mcpReleases.mcpServerId, mcpServerId)).orderBy(desc(mcpReleases.publishedAt)).limit(100); }
export async function addMcpDependency(input: { mcpServerId: string; ecosystem: string; packageName: string; versionRange?: string; direct?: boolean }) { const [dependency] = await db.insert(mcpDependencies).values({ id: uuidv7(), ...input }).returning(); return dependency; }
export async function listMcpDependencies(mcpServerId: string) { return db.select().from(mcpDependencies).where(eq(mcpDependencies.mcpServerId, mcpServerId)).orderBy(mcpDependencies.ecosystem, mcpDependencies.packageName).limit(1_000); }
