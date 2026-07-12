import { z } from "zod";

export const verificationLevels = ["unverified", "community_verified", "identity_verified", "organisation_verified", "security_verified", "enterprise_verified", "government_ready", "independently_audited"] as const;
export const productTypes = ["application", "mcp_server", "skill", "agent", "model", "api", "developer_tool"] as const;

export const companyInputSchema = z.object({
  legalName: z.string().trim().min(2).max(180),
  displayName: z.string().trim().min(2).max(120),
  websiteUrl: z.url().optional(),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  description: z.string().trim().max(2_000).optional(),
});

export const productInputSchema = z.object({
  companyId: z.uuid().optional(),
  name: z.string().trim().min(2).max(140),
  type: z.enum(productTypes),
  description: z.string().trim().max(2_000).optional(),
  websiteUrl: z.url().optional(),
  repositoryUrl: z.url().optional(),
  openSource: z.boolean().default(false),
});

export type CompanyInput = z.infer<typeof companyInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;

export function canonicalSlug(value: string, id: string) {
  const base = value.normalize("NFKD").replace(/[^\x00-\x7F]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
  return `${base || "subject"}-${id.slice(0, 8)}`;
}
