import { boolean, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { fraudSignalEnum, moderationStatusEnum, reputationEventEnum, reviewStatusEnum, subjectTypeEnum } from "./enums";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  authorUserId: uuid("author_user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  rating: integer("rating").notNull(),
  verifiedUse: boolean("verified_use").notNull().default(false),
  useCase: text("use_case"),
  status: reviewStatusEnum("status").notNull().default("pending"),
  contentHash: text("content_hash").notNull(),
  reputationWeight: numeric("reputation_weight", { precision: 5, scale: 4 }).notNull().default("1"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [index("reviews_subject_idx").on(table.subjectType, table.subjectId), index("reviews_author_idx").on(table.authorUserId), uniqueIndex("reviews_author_hash_idx").on(table.authorUserId, table.contentHash)]);

export const reviewVotes = pgTable("review_votes", {
  reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  helpful: boolean("helpful").notNull(),
  weight: numeric("weight", { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.reviewId, table.userId] })]);

export const suggestedEdits = pgTable("suggested_edits", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  submittedByUserId: uuid("submitted_by_user_id").notNull().references(() => users.id),
  patch: jsonb("patch").$type<Record<string, unknown>>().notNull(),
  rationale: text("rationale").notNull(),
  status: reviewStatusEnum("status").notNull().default("pending"),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
}, (table) => [index("suggested_edits_subject_idx").on(table.subjectType, table.subjectId)]);

export const moderationCases = pgTable("moderation_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterUserId: uuid("reporter_user_id").references(() => users.id),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: moderationStatusEnum("status").notNull().default("open"),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("moderation_target_idx").on(table.targetType, table.targetId), index("moderation_status_idx").on(table.status)]);

export const reputationLedger = pgTable("reputation_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  event: reputationEventEnum("event").notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("reputation_user_idx").on(table.userId, table.createdAt), uniqueIndex("reputation_source_idx").on(table.userId, table.event, table.sourceType, table.sourceId)]);

export const fraudSignals = pgTable("fraud_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: text("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  signal: fraudSignalEnum("signal").notNull(),
  severity: integer("severity").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  explanation: text("explanation").notNull(),
  features: jsonb("features").$type<Record<string, number | string | boolean>>().notNull().default({}),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("fraud_subject_idx").on(table.subjectType, table.subjectId), index("fraud_unresolved_idx").on(table.resolvedAt)]);
