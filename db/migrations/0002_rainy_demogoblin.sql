CREATE TYPE "public"."claim_method" AS ENUM('dns', 'email', 'github', 'oauth', 'signed_challenge');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('pending', 'verified', 'failed', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."fraud_signal" AS ENUM('duplicate_content', 'review_burst', 'coordinated_vote', 'account_cluster', 'velocity', 'identity_mismatch');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('open', 'investigating', 'actioned', 'dismissed', 'appealed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."reputation_event" AS ENUM('review_published', 'review_helpful', 'edit_accepted', 'evidence_verified', 'security_research', 'moderation_upheld', 'penalty');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'rejected', 'removed', 'appealed');--> statement-breakpoint
CREATE TABLE "evidence_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" uuid NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"supporting_evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "evidence_status" DEFAULT 'pending' NOT NULL,
	"resolved_by_user_id" uuid,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vendor_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"method" "claim_method" NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"challenge_hash" text NOT NULL,
	"challenge_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"signal" "fraud_signal" NOT NULL,
	"severity" integer NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"explanation" text NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" "moderation_status" DEFAULT 'open' NOT NULL,
	"assigned_to_user_id" uuid,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event" "reputation_event" NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"helpful" boolean NOT NULL,
	"weight" numeric(5, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_votes_review_id_user_id_pk" PRIMARY KEY("review_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"rating" integer NOT NULL,
	"verified_use" boolean DEFAULT false NOT NULL,
	"use_case" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"content_hash" text NOT NULL,
	"reputation_weight" numeric(5, 4) DEFAULT '1' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suggested_edits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"patch" jsonb NOT NULL,
	"rationale" text NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "dimension" "trust_dimension" DEFAULT 'transparency' NOT NULL;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "value" numeric(5, 2) DEFAULT '50' NOT NULL;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "supersedes_evidence_id" uuid;--> statement-breakpoint
ALTER TABLE "evidence_challenges" ADD CONSTRAINT "evidence_challenges_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_challenges" ADD CONSTRAINT "evidence_challenges_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_challenges" ADD CONSTRAINT "evidence_challenges_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_claims" ADD CONSTRAINT "vendor_claims_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_claims" ADD CONSTRAINT "vendor_claims_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_ledger" ADD CONSTRAINT "reputation_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_edits" ADD CONSTRAINT "suggested_edits_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_edits" ADD CONSTRAINT "suggested_edits_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_challenge_idx" ON "evidence_challenges" USING btree ("evidence_id","status");--> statement-breakpoint
CREATE INDEX "vendor_claim_subject_idx" ON "vendor_claims" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "vendor_claim_org_idx" ON "vendor_claims" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "fraud_subject_idx" ON "fraud_signals" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "fraud_unresolved_idx" ON "fraud_signals" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "moderation_target_idx" ON "moderation_cases" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "moderation_status_idx" ON "moderation_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reputation_user_idx" ON "reputation_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_source_idx" ON "reputation_ledger" USING btree ("user_id","event","source_type","source_id");--> statement-breakpoint
CREATE INDEX "reviews_subject_idx" ON "reviews" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "reviews_author_idx" ON "reviews" USING btree ("author_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_author_hash_idx" ON "reviews" USING btree ("author_user_id","content_hash");--> statement-breakpoint
CREATE INDEX "suggested_edits_subject_idx" ON "suggested_edits" USING btree ("subject_type","subject_id");