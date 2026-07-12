import { index, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { memberRoleEnum } from "./enums";

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  dataRegion: text("data_region").notNull().default("au"),
  securityPolicy: jsonb("security_policy").$type<{ mfaMode?: "optional" | "admin_required" | "all_users_required" }>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [uniqueIndex("organisations_slug_idx").on(table.slug)]);

export const organisationMembers = pgTable("organisation_members", {
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.organisationId, table.userId] }),
  index("organisation_members_user_idx").on(table.userId),
]);
