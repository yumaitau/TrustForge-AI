import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { aiEvaluationKindEnum, aiEvaluationOutcomeEnum, findingStatusEnum, monitoringRunStatusEnum, monitoringTargetTypeEnum, securitySeverityEnum, subjectTypeEnum } from "./enums";
import { organisations } from "./organisations";
import { users } from "./auth";

export type SourceSnapshot = { fetchedAt: string; sourceUrl?: string; license?: string; sha256: string; payload: Record<string, unknown> };

export const securityAdvisories = pgTable("security_advisories", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
  aliases: text("aliases").array().notNull().default([]),
  summary: text("summary").notNull(),
  details: text("details"),
  severity: securitySeverityEnum("severity").notNull().default("unknown"),
  affected: jsonb("affected").$type<Array<{ ecosystem: string; packageName: string; ranges?: string[] }>>().notNull().default([]),
  sourceUrl: text("source_url").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  modifiedAt: timestamp("modified_at", { withTimezone: true }),
  snapshot: jsonb("snapshot").$type<SourceSnapshot>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("security_advisory_source_external_idx").on(table.source, table.externalId), index("security_advisory_severity_idx").on(table.severity), index("security_advisory_aliases_idx").using("gin", table.aliases)]);

export const securityFindings = pgTable("security_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  advisoryId: uuid("advisory_id").references(() => securityAdvisories.id, { onDelete: "set null" }),
  scanner: text("scanner").notNull(),
  fingerprint: text("fingerprint").notNull(),
  title: text("title").notNull(),
  severity: securitySeverityEnum("severity").notNull().default("unknown"),
  status: findingStatusEnum("status").notNull().default("open"),
  affectedComponent: text("affected_component"),
  affectedVersion: text("affected_version"),
  remediation: text("remediation"),
  observed: jsonb("observed").$type<Record<string, unknown>>().notNull().default({}),
  rawSnapshot: jsonb("raw_snapshot").$type<SourceSnapshot>().notNull(),
  firstObservedAt: timestamp("first_observed_at", { withTimezone: true }).notNull(),
  lastObservedAt: timestamp("last_observed_at", { withTimezone: true }).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  adjudicatedByUserId: uuid("adjudicated_by_user_id").references(() => users.id),
  adjudicationReason: text("adjudication_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("security_finding_dedupe_idx").on(table.subjectType, table.subjectId, table.scanner, table.fingerprint), index("security_finding_subject_idx").on(table.subjectType, table.subjectId, table.status), index("security_finding_advisory_idx").on(table.advisoryId)]);

export const softwareBillsOfMaterials = pgTable("software_bills_of_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  format: text("format").notNull(),
  specVersion: text("spec_version"),
  documentName: text("document_name").notNull(),
  documentHash: text("document_hash").notNull(),
  sourceUrl: text("source_url"),
  importedByUserId: uuid("imported_by_user_id").references(() => users.id),
  sourceSnapshot: jsonb("source_snapshot").$type<SourceSnapshot>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("sbom_subject_hash_idx").on(table.subjectType, table.subjectId, table.documentHash), index("sbom_subject_idx").on(table.subjectType, table.subjectId)]);

export const sbomComponents = pgTable("sbom_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  sbomId: uuid("sbom_id").notNull().references(() => softwareBillsOfMaterials.id, { onDelete: "cascade" }),
  bomRef: text("bom_ref"),
  purl: text("purl"),
  ecosystem: text("ecosystem"),
  packageName: text("package_name").notNull(),
  version: text("version"),
  licenses: text("licenses").array().notNull().default([]),
  hashes: jsonb("hashes").$type<Record<string, string>>().notNull().default({}),
  direct: boolean("direct").notNull().default(false),
}, (table) => [index("sbom_component_lookup_idx").on(table.ecosystem, table.packageName, table.version), index("sbom_component_document_idx").on(table.sbomId)]);

export const monitoringTargets = pgTable("monitoring_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  targetType: monitoringTargetTypeEnum("target_type").notNull(),
  target: text("target").notNull(),
  source: text("source").notNull(),
  intervalMinutes: integer("interval_minutes").notNull().default(1440),
  nextCheckAt: timestamp("next_check_at", { withTimezone: true }).notNull().defaultNow(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  enabled: boolean("enabled").notNull().default(true),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("monitoring_target_unique_idx").on(table.organisationId, table.targetType, table.target), index("monitoring_target_due_idx").on(table.enabled, table.nextCheckAt), index("monitoring_target_subject_idx").on(table.subjectType, table.subjectId)]);

export const monitoringRuns = pgTable("monitoring_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetId: uuid("target_id").notNull().references(() => monitoringTargets.id, { onDelete: "cascade" }),
  status: monitoringRunStatusEnum("status").notNull().default("queued"),
  attempt: integer("attempt").notNull().default(0),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  beforeState: jsonb("before_state").$type<Record<string, unknown>>().notNull().default({}),
  afterState: jsonb("after_state").$type<Record<string, unknown>>().notNull().default({}),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("monitoring_run_target_idx").on(table.targetId, table.createdAt), index("monitoring_run_status_idx").on(table.status, table.leaseExpiresAt)]);

export const eventOutbox = pgTable("event_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").references(() => organisations.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  deduplicationKey: text("deduplication_key").notNull(),
  attempts: integer("attempts").notNull().default(0),
  availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  deadLetteredAt: timestamp("dead_lettered_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("event_outbox_dedupe_idx").on(table.eventType, table.deduplicationKey), index("event_outbox_available_idx").on(table.processedAt, table.deadLetteredAt, table.availableAt)]);

export const monitoringSubscriptions = pgTable("monitoring_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  eventTypes: text("event_types").array().notNull().default([]),
  channels: text("channels").array().notNull().default(["in_app"]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("monitoring_subscription_unique_idx").on(table.organisationId, table.userId, table.subjectType, table.subjectId), index("monitoring_subscription_subject_idx").on(table.subjectType, table.subjectId)]);

export const aiEvaluationSuites = pgTable("ai_evaluation_suites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: aiEvaluationKindEnum("kind").notNull(),
  version: text("version").notNull(),
  methodology: text("methodology").notNull(),
  sensitive: boolean("sensitive").notNull().default(false),
  disclosurePolicy: text("disclosure_policy").notNull().default("coordinated"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("ai_evaluation_suite_version_idx").on(table.organisationId, table.name, table.version), index("ai_evaluation_suite_kind_idx").on(table.kind)]);

export const aiEvaluationCases = pgTable("ai_evaluation_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  suiteId: uuid("suite_id").notNull().references(() => aiEvaluationSuites.id, { onDelete: "cascade" }),
  caseId: text("case_id").notNull(),
  promptHash: text("prompt_hash").notNull(),
  expectedOutcome: aiEvaluationOutcomeEnum("expected_outcome").notNull(),
  rubric: jsonb("rubric").$type<Record<string, unknown>>().notNull().default({}),
  sensitive: boolean("sensitive").notNull().default(false),
}, (table) => [uniqueIndex("ai_evaluation_case_unique_idx").on(table.suiteId, table.caseId), index("ai_evaluation_case_suite_idx").on(table.suiteId)]);

export const aiEvaluationRuns = pgTable("ai_evaluation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  suiteId: uuid("suite_id").notNull().references(() => aiEvaluationSuites.id),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  environment: jsonb("environment").$type<{ targetVersion: string; modelVersion?: string; environmentHash: string; executionMode: "controlled_lab" | "imported" }>().notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  score: numeric("score", { precision: 5, scale: 2 }),
  claimSummary: text("claim_summary"),
  status: monitoringRunStatusEnum("status").notNull().default("queued"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("ai_evaluation_run_subject_idx").on(table.subjectType, table.subjectId, table.createdAt), index("ai_evaluation_run_suite_idx").on(table.suiteId)]);

export const aiEvaluationResults = pgTable("ai_evaluation_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => aiEvaluationRuns.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").references(() => aiEvaluationCases.id, { onDelete: "set null" }),
  outcome: aiEvaluationOutcomeEnum("outcome").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  observedBehavior: text("observed_behavior").notNull(),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
  disclosureRestricted: boolean("disclosure_restricted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("ai_evaluation_result_run_idx").on(table.runId), index("ai_evaluation_result_case_idx").on(table.caseId)]);
