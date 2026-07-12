CREATE TYPE "public"."research_review_kind" AS ENUM('ethics', 'security');--> statement-breakpoint
CREATE TYPE "public"."research_status" AS ENUM('draft', 'submitted', 'in_review', 'approved', 'in_progress', 'completed', 'rejected', 'promoted');--> statement-breakpoint
CREATE TABLE "research_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"hypothesis" text NOT NULL,
	"exit_criteria" text NOT NULL,
	"data_protection_plan" text NOT NULL,
	"status" "research_status" DEFAULT 'draft' NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"outcome" text,
	"outcome_url" text,
	"rejection_rationale" text,
	"promoted_issue_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"kind" "research_review_kind" NOT NULL,
	"approved" boolean NOT NULL,
	"notes" text NOT NULL,
	"reviewed_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_proposals" ADD CONSTRAINT "research_proposals_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_proposals" ADD CONSTRAINT "research_proposals_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reviews" ADD CONSTRAINT "research_reviews_proposal_id_research_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."research_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reviews" ADD CONSTRAINT "research_reviews_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "research_proposal_key_idx" ON "research_proposals" USING btree ("organisation_id","key");--> statement-breakpoint
CREATE INDEX "research_proposal_status_idx" ON "research_proposals" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX "research_review_proposal_idx" ON "research_reviews" USING btree ("proposal_id","kind","created_at");