import { z } from "zod";

const filesystemPermission = z.object({ path: z.string().min(1).max(500), access: z.enum(["read", "write", "read_write"]) });
const networkPermission = z.object({ host: z.string().min(1).max(253), ports: z.array(z.number().int().min(1).max(65535)).max(50).optional() });
export const permissionSchema = z.object({ filesystem: z.array(filesystemPermission).max(100).optional(), network: z.array(networkPermission).max(100).optional(), secrets: z.array(z.string().min(1).max(120)).max(100).optional(), processExecution: z.boolean().optional(), userData: z.array(z.string().max(120)).max(100).optional() });

const baseProfile = { companyId: z.uuid().optional(), name: z.string().trim().min(2).max(140), description: z.string().trim().max(2_000).optional(), websiteUrl: z.url().optional(), repositoryUrl: z.url().optional(), openSource: z.boolean().default(false) };

export const mcpServerInputSchema = z.object({ ...baseProfile,
  maintainer: z.string().trim().max(180).optional(), documentationUrl: z.url().optional(), packageIdentifier: z.string().trim().min(2).max(240).optional(),
  transports: z.array(z.enum(["stdio", "http", "websocket"])).min(1), permissions: permissionSchema.default({}),
  authenticationMethods: z.array(z.string().max(80)).max(30).default([]), secretsRequired: z.array(z.string().max(120)).max(100).default([]),
  oauthSupported: z.boolean().default(false), sandboxCompatible: z.boolean().default(false), enterpriseReady: z.boolean().default(false), maintenanceStatus: z.enum(["active", "maintenance", "unmaintained", "archived", "unknown"]).default("unknown"),
});

export const skillInputSchema = z.object({ ...baseProfile, format: z.enum(["chatgpt", "claude", "mcp", "custom"]), version: z.string().max(80).optional(), manifest: z.record(z.string(), z.unknown()).default({}), capabilities: z.array(z.string().max(120)).max(100).default([]), permissions: permissionSchema.default({}), compatibleHosts: z.array(z.string().max(120)).max(50).default([]) });
export const agentInputSchema = z.object({ ...baseProfile, capabilities: z.array(z.string().max(120)).max(100).default([]), permissions: permissionSchema.default({}), autonomyLevel: z.number().int().min(0).max(5), deploymentModes: z.array(z.string().max(80)).max(30).default([]), modelDependencies: z.array(z.string().max(180)).max(50).default([]) });
export const modelInputSchema = z.object({ ...baseProfile, family: z.string().min(1).max(120), providerModelId: z.string().min(1).max(180), modalities: z.array(z.enum(["text", "image", "audio", "video", "embedding"])).min(1), contextWindow: z.number().int().positive().max(100_000_000).optional(), openWeights: z.boolean().default(false), license: z.string().max(180).optional(), trainingDataSummary: z.string().max(4_000).optional(), safetyDocumentationUrl: z.url().optional() });
export const apiOfferingInputSchema = z.object({ ...baseProfile, baseUrl: z.url(), authenticationMethods: z.array(z.string().max(80)).max(30).default([]), protocols: z.array(z.enum(["https", "websocket", "grpc"])).min(1).default(["https"]), dataResidencyRegions: z.array(z.string().max(80)).max(100).default([]), retentionSummary: z.string().max(2_000).optional(), trainingUsage: z.string().max(2_000).optional(), slaUrl: z.url().optional(), pricingUrl: z.url().optional() });

export type McpServerInput = z.infer<typeof mcpServerInputSchema>;
export type SkillInput = z.infer<typeof skillInputSchema>;
export type AgentInput = z.infer<typeof agentInputSchema>;
export type ModelInput = z.infer<typeof modelInputSchema>;
export type ApiOfferingInput = z.infer<typeof apiOfferingInputSchema>;
