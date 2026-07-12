import { z } from "zod";

export const subjectSchema = z.object({ subjectType: z.enum(["company", "product", "mcp_server", "skill", "agent", "model", "api"]), subjectId: z.uuid() });
export const severitySchema = z.enum(["unknown", "none", "low", "medium", "high", "critical"]);
export const snapshotSchema = z.object({ fetchedAt: z.coerce.date(), sourceUrl: z.url().optional(), license: z.string().max(200).optional(), sha256: z.string().regex(/^[a-f0-9]{64}$/), payload: z.record(z.string(), z.unknown()) });

export const advisoryInputSchema = z.object({
  source: z.enum(["osv", "github_advisory", "cve", "manual"]), externalId: z.string().trim().min(2).max(200), aliases: z.array(z.string().trim().min(2).max(200)).max(40).default([]),
  summary: z.string().trim().min(3).max(2_000), details: z.string().trim().max(20_000).optional(), severity: severitySchema.default("unknown"),
  affected: z.array(z.object({ ecosystem: z.string().trim().min(1).max(80), packageName: z.string().trim().min(1).max(240), ranges: z.array(z.string().trim().max(300)).max(50).optional() })).max(500).default([]),
  sourceUrl: z.url(), publishedAt: z.coerce.date().optional(), modifiedAt: z.coerce.date().optional(), snapshot: snapshotSchema,
});
export type AdvisoryInput = z.infer<typeof advisoryInputSchema>;

export const findingInputSchema = subjectSchema.extend({
  advisoryId: z.uuid().optional(), scanner: z.string().trim().min(2).max(120), fingerprint: z.string().trim().min(8).max(200), title: z.string().trim().min(3).max(500), severity: severitySchema.default("unknown"),
  affectedComponent: z.string().trim().max(500).optional(), affectedVersion: z.string().trim().max(200).optional(), remediation: z.string().trim().max(4_000).optional(), observed: z.record(z.string(), z.unknown()).default({}), rawSnapshot: snapshotSchema,
});
export const findingAdjudicationSchema = z.object({ status: z.enum(["accepted_risk", "false_positive", "resolved", "not_affected"]), reason: z.string().trim().min(8).max(4_000) });

const componentSchema = z.object({ bomRef: z.string().trim().max(500).optional(), purl: z.string().trim().max(1_000).optional(), ecosystem: z.string().trim().max(80).optional(), packageName: z.string().trim().min(1).max(240), version: z.string().trim().max(200).optional(), licenses: z.array(z.string().trim().max(150)).max(50).default([]), hashes: z.record(z.string(), z.string().max(300)).default({}), direct: z.boolean().default(false) });
export const sbomInputSchema = subjectSchema.extend({ format: z.enum(["cyclonedx", "spdx"]), specVersion: z.string().trim().max(50).optional(), documentName: z.string().trim().min(1).max(500), documentHash: z.string().regex(/^[a-f0-9]{64}$/), sourceUrl: z.url().optional(), sourceSnapshot: snapshotSchema, components: z.array(componentSchema).min(1).max(20_000) });

export const monitoringTargetInputSchema = subjectSchema.extend({ targetType: z.enum(["release", "repository", "vulnerability", "ownership", "domain", "certificate", "incident", "disclosure"]), target: z.string().trim().min(2).max(2_000), source: z.string().trim().min(2).max(120), intervalMinutes: z.number().int().min(5).max(43_200).default(1_440), configuration: z.record(z.string(), z.unknown()).default({}) });
export const subscriptionInputSchema = subjectSchema.extend({ eventTypes: z.array(z.string().trim().min(2).max(120)).max(30).default([]), channels: z.array(z.enum(["in_app", "email", "webhook"])).min(1).max(3).default(["in_app"]) });

export const aiEvaluationSuiteInputSchema = z.object({ name: z.string().trim().min(3).max(180), kind: z.enum(["prompt_injection", "data_retention", "training_usage", "jailbreak_resilience", "permission_model", "tool_safety", "responsible_ai"]), version: z.string().trim().min(1).max(80), methodology: z.string().trim().min(30).max(12_000), sensitive: z.boolean().default(false), disclosurePolicy: z.enum(["coordinated", "immediate", "private"]).default("coordinated"), cases: z.array(z.object({ caseId: z.string().trim().min(1).max(100), promptHash: z.string().regex(/^[a-f0-9]{64}$/), expectedOutcome: z.enum(["pass", "fail", "inconclusive", "not_applicable"]), rubric: z.record(z.string(), z.unknown()).default({}), sensitive: z.boolean().default(false) })).min(1).max(2_000) });
export const aiEvaluationRunInputSchema = subjectSchema.extend({ suiteId: z.uuid(), environment: z.object({ targetVersion: z.string().trim().min(1).max(200), modelVersion: z.string().trim().max(200).optional(), environmentHash: z.string().regex(/^[a-f0-9]{64}$/), executionMode: z.enum(["controlled_lab", "imported"]) }), observedAt: z.coerce.date(), claimSummary: z.string().trim().max(4_000).optional(), results: z.array(z.object({ caseId: z.uuid().optional(), outcome: z.enum(["pass", "fail", "inconclusive", "not_applicable"]), score: z.number().min(0).max(100), observedBehavior: z.string().trim().min(3).max(8_000), evidence: z.record(z.string(), z.unknown()).default({}), disclosureRestricted: z.boolean().default(false) })).min(1).max(2_000) });
