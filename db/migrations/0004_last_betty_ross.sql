CREATE TYPE "public"."ai_evaluation_kind" AS ENUM('prompt_injection', 'data_retention', 'training_usage', 'jailbreak_resilience', 'permission_model', 'tool_safety', 'responsible_ai');--> statement-breakpoint
CREATE TYPE "public"."ai_evaluation_outcome" AS ENUM('pass', 'fail', 'inconclusive', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."finding_status" AS ENUM('open', 'accepted_risk', 'false_positive', 'resolved', 'not_affected');--> statement-breakpoint
CREATE TYPE "public"."monitoring_run_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'dead_lettered');--> statement-breakpoint
CREATE TYPE "public"."monitoring_target_type" AS ENUM('release', 'repository', 'vulnerability', 'ownership', 'domain', 'certificate', 'incident', 'disclosure');--> statement-breakpoint
CREATE TYPE "public"."security_severity" AS ENUM('unknown', 'none', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TABLE "ai_evaluation_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suite_id" uuid NOT NULL,
	"case_id" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"expected_outcome" "ai_evaluation_outcome" NOT NULL,
	"rubric" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_evaluation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"case_id" uuid,
	"outcome" "ai_evaluation_outcome" NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"observed_behavior" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"disclosure_restricted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_evaluation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suite_id" uuid NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"environment" jsonb NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"score" numeric(5, 2),
	"claim_summary" text,
	"status" "monitoring_run_status" DEFAULT 'queued' NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_evaluation_suites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "ai_evaluation_kind" NOT NULL,
	"version" text NOT NULL,
	"methodology" text NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"disclosure_policy" text DEFAULT 'coordinated' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid,
	"event_type" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"deduplication_key" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"dead_lettered_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid NOT NULL,
	"status" "monitoring_run_status" DEFAULT 'queued' NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"before_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"after_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"event_types" text[] DEFAULT '{}' NOT NULL,
	"channels" text[] DEFAULT '{"in_app"}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"target_type" "monitoring_target_type" NOT NULL,
	"target" text NOT NULL,
	"source" text NOT NULL,
	"interval_minutes" integer DEFAULT 1440 NOT NULL,
	"next_check_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_checked_at" timestamp with time zone,
	"enabled" boolean DEFAULT true NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sbom_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sbom_id" uuid NOT NULL,
	"bom_ref" text,
	"purl" text,
	"ecosystem" text,
	"package_name" text NOT NULL,
	"version" text,
	"licenses" text[] DEFAULT '{}' NOT NULL,
	"hashes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"direct" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_advisories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"aliases" text[] DEFAULT '{}' NOT NULL,
	"summary" text NOT NULL,
	"details" text,
	"severity" "security_severity" DEFAULT 'unknown' NOT NULL,
	"affected" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_url" text NOT NULL,
	"published_at" timestamp with time zone,
	"modified_at" timestamp with time zone,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"advisory_id" uuid,
	"scanner" text NOT NULL,
	"fingerprint" text NOT NULL,
	"title" text NOT NULL,
	"severity" "security_severity" DEFAULT 'unknown' NOT NULL,
	"status" "finding_status" DEFAULT 'open' NOT NULL,
	"affected_component" text,
	"affected_version" text,
	"remediation" text,
	"observed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"raw_snapshot" jsonb NOT NULL,
	"first_observed_at" timestamp with time zone NOT NULL,
	"last_observed_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"adjudicated_by_user_id" uuid,
	"adjudication_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "software_bills_of_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"format" text NOT NULL,
	"spec_version" text,
	"document_name" text NOT NULL,
	"document_hash" text NOT NULL,
	"source_url" text,
	"imported_by_user_id" uuid,
	"source_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_evaluation_cases" ADD CONSTRAINT "ai_evaluation_cases_suite_id_ai_evaluation_suites_id_fk" FOREIGN KEY ("suite_id") REFERENCES "public"."ai_evaluation_suites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluation_results" ADD CONSTRAINT "ai_evaluation_results_run_id_ai_evaluation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_evaluation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluation_results" ADD CONSTRAINT "ai_evaluation_results_case_id_ai_evaluation_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."ai_evaluation_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluation_runs" ADD CONSTRAINT "ai_evaluation_runs_suite_id_ai_evaluation_suites_id_fk" FOREIGN KEY ("suite_id") REFERENCES "public"."ai_evaluation_suites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluation_runs" ADD CONSTRAINT "ai_evaluation_runs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluation_suites" ADD CONSTRAINT "ai_evaluation_suites_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_outbox" ADD CONSTRAINT "event_outbox_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_runs" ADD CONSTRAINT "monitoring_runs_target_id_monitoring_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."monitoring_targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_subscriptions" ADD CONSTRAINT "monitoring_subscriptions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_subscriptions" ADD CONSTRAINT "monitoring_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_targets" ADD CONSTRAINT "monitoring_targets_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sbom_components" ADD CONSTRAINT "sbom_components_sbom_id_software_bills_of_materials_id_fk" FOREIGN KEY ("sbom_id") REFERENCES "public"."software_bills_of_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_findings" ADD CONSTRAINT "security_findings_advisory_id_security_advisories_id_fk" FOREIGN KEY ("advisory_id") REFERENCES "public"."security_advisories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_findings" ADD CONSTRAINT "security_findings_adjudicated_by_user_id_users_id_fk" FOREIGN KEY ("adjudicated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_bills_of_materials" ADD CONSTRAINT "software_bills_of_materials_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_evaluation_case_unique_idx" ON "ai_evaluation_cases" USING btree ("suite_id","case_id");--> statement-breakpoint
CREATE INDEX "ai_evaluation_case_suite_idx" ON "ai_evaluation_cases" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "ai_evaluation_result_run_idx" ON "ai_evaluation_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_evaluation_result_case_idx" ON "ai_evaluation_results" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "ai_evaluation_run_subject_idx" ON "ai_evaluation_runs" USING btree ("subject_type","subject_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_evaluation_run_suite_idx" ON "ai_evaluation_runs" USING btree ("suite_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_evaluation_suite_version_idx" ON "ai_evaluation_suites" USING btree ("organisation_id","name","version");--> statement-breakpoint
CREATE INDEX "ai_evaluation_suite_kind_idx" ON "ai_evaluation_suites" USING btree ("kind");--> statement-breakpoint
CREATE UNIQUE INDEX "event_outbox_dedupe_idx" ON "event_outbox" USING btree ("event_type","deduplication_key");--> statement-breakpoint
CREATE INDEX "event_outbox_available_idx" ON "event_outbox" USING btree ("processed_at","dead_lettered_at","available_at");--> statement-breakpoint
CREATE INDEX "monitoring_run_target_idx" ON "monitoring_runs" USING btree ("target_id","created_at");--> statement-breakpoint
CREATE INDEX "monitoring_run_status_idx" ON "monitoring_runs" USING btree ("status","lease_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "monitoring_subscription_unique_idx" ON "monitoring_subscriptions" USING btree ("organisation_id","user_id","subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "monitoring_subscription_subject_idx" ON "monitoring_subscriptions" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "monitoring_target_unique_idx" ON "monitoring_targets" USING btree ("organisation_id","target_type","target");--> statement-breakpoint
CREATE INDEX "monitoring_target_due_idx" ON "monitoring_targets" USING btree ("enabled","next_check_at");--> statement-breakpoint
CREATE INDEX "monitoring_target_subject_idx" ON "monitoring_targets" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "sbom_component_lookup_idx" ON "sbom_components" USING btree ("ecosystem","package_name","version");--> statement-breakpoint
CREATE INDEX "sbom_component_document_idx" ON "sbom_components" USING btree ("sbom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "security_advisory_source_external_idx" ON "security_advisories" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "security_advisory_severity_idx" ON "security_advisories" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "security_advisory_aliases_idx" ON "security_advisories" USING gin ("aliases");--> statement-breakpoint
CREATE UNIQUE INDEX "security_finding_dedupe_idx" ON "security_findings" USING btree ("subject_type","subject_id","scanner","fingerprint");--> statement-breakpoint
CREATE INDEX "security_finding_subject_idx" ON "security_findings" USING btree ("subject_type","subject_id","status");--> statement-breakpoint
CREATE INDEX "security_finding_advisory_idx" ON "security_findings" USING btree ("advisory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sbom_subject_hash_idx" ON "software_bills_of_materials" USING btree ("subject_type","subject_id","document_hash");--> statement-breakpoint
CREATE INDEX "sbom_subject_idx" ON "software_bills_of_materials" USING btree ("subject_type","subject_id");