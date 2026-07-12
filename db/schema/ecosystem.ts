import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { companies, products } from "./registry";

export type McpPermissions = {
  filesystem?: Array<{ path: string; access: "read" | "write" | "read_write" }>;
  network?: Array<{ host: string; ports?: number[] }>;
  secrets?: string[];
  processExecution?: boolean;
  userData?: string[];
};

export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  publisherCompanyId: uuid("publisher_company_id").references(() => companies.id),
  maintainer: text("maintainer"),
  repositoryUrl: text("repository_url"),
  documentationUrl: text("documentation_url"),
  packageIdentifier: text("package_identifier"),
  transports: text("transports").array().notNull().default([]),
  permissions: jsonb("permissions").$type<McpPermissions>().notNull().default({}),
  authenticationMethods: text("authentication_methods").array().notNull().default([]),
  secretsRequired: text("secrets_required").array().notNull().default([]),
  oauthSupported: boolean("oauth_supported").notNull().default(false),
  sandboxCompatible: boolean("sandbox_compatible").notNull().default(false),
  enterpriseReady: boolean("enterprise_ready").notNull().default(false),
  maintenanceStatus: text("maintenance_status").notNull().default("unknown"),
  manifestVersion: text("manifest_version").notNull().default("1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("mcp_product_idx").on(table.productId), uniqueIndex("mcp_package_idx").on(table.packageIdentifier), index("mcp_publisher_idx").on(table.publisherCompanyId)]);

export const mcpReleases = pgTable("mcp_releases", {
  id: uuid("id").primaryKey().defaultRandom(),
  mcpServerId: uuid("mcp_server_id").notNull().references(() => mcpServers.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  releaseUrl: text("release_url"),
  commitSha: text("commit_sha"),
  signatureVerified: boolean("signature_verified").notNull().default(false),
  sbomUrl: text("sbom_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("mcp_release_version_idx").on(table.mcpServerId, table.version), index("mcp_release_time_idx").on(table.mcpServerId, table.publishedAt)]);

export const mcpDependencies = pgTable("mcp_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  mcpServerId: uuid("mcp_server_id").notNull().references(() => mcpServers.id, { onDelete: "cascade" }),
  ecosystem: text("ecosystem").notNull(),
  packageName: text("package_name").notNull(),
  versionRange: text("version_range"),
  direct: boolean("direct").notNull().default(true),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("mcp_dependency_server_idx").on(table.mcpServerId), index("mcp_dependency_package_idx").on(table.ecosystem, table.packageName)]);

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(), productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  format: text("format").notNull(), version: text("version"), manifest: jsonb("manifest").$type<Record<string, unknown>>().notNull().default({}),
  capabilities: text("capabilities").array().notNull().default([]), permissions: jsonb("permissions").$type<McpPermissions>().notNull().default({}),
  compatibleHosts: text("compatible_hosts").array().notNull().default([]), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("skills_product_idx").on(table.productId), index("skills_format_idx").on(table.format)]);

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(), productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  capabilities: text("capabilities").array().notNull().default([]), permissions: jsonb("permissions").$type<McpPermissions>().notNull().default({}),
  autonomyLevel: integer("autonomy_level").notNull().default(1), deploymentModes: text("deployment_modes").array().notNull().default([]),
  modelDependencies: text("model_dependencies").array().notNull().default([]), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("agents_product_idx").on(table.productId)]);

export const models = pgTable("models", {
  id: uuid("id").primaryKey().defaultRandom(), productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  family: text("family").notNull(), providerModelId: text("provider_model_id").notNull(), modalities: text("modalities").array().notNull().default([]),
  contextWindow: integer("context_window"), openWeights: boolean("open_weights").notNull().default(false), license: text("license"),
  trainingDataSummary: text("training_data_summary"), safetyDocumentationUrl: text("safety_documentation_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("models_product_idx").on(table.productId), uniqueIndex("models_provider_id_idx").on(table.providerModelId)]);

export const apiOfferings = pgTable("api_offerings", {
  id: uuid("id").primaryKey().defaultRandom(), productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  baseUrl: text("base_url").notNull(), authenticationMethods: text("authentication_methods").array().notNull().default([]),
  protocols: text("protocols").array().notNull().default(["https"]), dataResidencyRegions: text("data_residency_regions").array().notNull().default([]),
  retentionSummary: text("retention_summary"), trainingUsage: text("training_usage"), slaUrl: text("sla_url"), pricingUrl: text("pricing_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("api_product_idx").on(table.productId), uniqueIndex("api_base_url_idx").on(table.baseUrl)]);
