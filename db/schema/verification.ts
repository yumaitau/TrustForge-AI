import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { claimMethodEnum, claimStatusEnum, subjectTypeEnum } from "./enums";
import { organisations } from "./organisations";
import { users } from "./auth";

export const vendorClaims = pgTable("vendor_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id),
  requestedByUserId: uuid("requested_by_user_id").notNull().references(() => users.id),
  method: claimMethodEnum("method").notNull(),
  status: claimStatusEnum("status").notNull().default("pending"),
  challengeHash: text("challenge_hash").notNull(),
  challengeMetadata: jsonb("challenge_metadata").$type<{ target?: string; provider?: string; publicKey?: string; codeHash?: string }>().notNull().default({}),
  attempts: jsonb("attempts").$type<Array<{ at: string; outcome: string }>>().notNull().default([]),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("vendor_claim_subject_idx").on(table.subjectType, table.subjectId), index("vendor_claim_org_idx").on(table.organisationId)]);
