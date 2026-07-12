import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { evidenceSourceEnum, evidenceStatusEnum, productTypeEnum, subjectTypeEnum, trustDimensionEnum, verificationLevelEnum } from "./enums";
import { organisations } from "./organisations";
import { users } from "./auth";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  legalName: text("legal_name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  websiteUrl: text("website_url"),
  countryCode: text("country_code"),
  verificationLevel: verificationLevelEnum("verification_level").notNull().default("unverified"),
  claimedByOrganisationId: uuid("claimed_by_organisation_id").references(() => organisations.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [uniqueIndex("companies_slug_idx").on(table.slug), index("companies_country_idx").on(table.countryCode)]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  type: productTypeEnum("type").notNull(),
  description: text("description"),
  websiteUrl: text("website_url"),
  repositoryUrl: text("repository_url"),
  openSource: boolean("open_source").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  verificationLevel: verificationLevelEnum("verification_level").notNull().default("unverified"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [uniqueIndex("products_slug_idx").on(table.slug), index("products_company_idx").on(table.companyId), index("products_type_idx").on(table.type)]);

export const evidence = pgTable("evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  source: evidenceSourceEnum("source").notNull(),
  sourceUrl: text("source_url"),
  contentHash: text("content_hash"),
  status: evidenceStatusEnum("status").notNull().default("pending"),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull().default("0"),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  submittedByUserId: uuid("submitted_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("evidence_subject_idx").on(table.subjectType, table.subjectId), index("evidence_status_idx").on(table.status)]);

export const trustScores = pgTable("trust_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  methodologyVersion: text("methodology_version").notNull(),
  explanation: jsonb("explanation").$type<{ summary: string; evidenceIds: string[] }>().notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("trust_scores_subject_idx").on(table.subjectType, table.subjectId, table.calculatedAt)]);

export const trustScoreComponents = pgTable("trust_score_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  trustScoreId: uuid("trust_score_id").notNull().references(() => trustScores.id, { onDelete: "cascade" }),
  dimension: trustDimensionEnum("dimension").notNull(),
  rawScore: numeric("raw_score", { precision: 5, scale: 2 }).notNull(),
  weight: numeric("weight", { precision: 5, scale: 4 }).notNull(),
  weightedScore: numeric("weighted_score", { precision: 5, scale: 2 }).notNull(),
  evidenceCount: integer("evidence_count").notNull(),
  rationale: text("rationale").notNull(),
  evidenceIds: jsonb("evidence_ids").$type<string[]>().notNull().default([]),
}, (table) => [index("trust_components_score_idx").on(table.trustScoreId)]);
