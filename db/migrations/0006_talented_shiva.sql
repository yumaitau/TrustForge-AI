CREATE TYPE "public"."assessment_status" AS ENUM('draft', 'in_progress', 'review_required', 'complete');--> statement-breakpoint
CREATE TABLE "assessment_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"control_id" uuid NOT NULL,
	"applicable" boolean DEFAULT true NOT NULL,
	"inherited" boolean DEFAULT false NOT NULL,
	"inherited_from" text,
	"status" text DEFAULT 'not_assessed' NOT NULL,
	"evidence_ids" text[] DEFAULT '{}' NOT NULL,
	"gap" text,
	"rationale" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"framework_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "assessment_status" DEFAULT 'draft' NOT NULL,
	"scope" text NOT NULL,
	"qualified_reviewer_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "compliance_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"framework_id" uuid NOT NULL,
	"control_key" text NOT NULL,
	"title" text NOT NULL,
	"guidance" text,
	"classification" "classification" DEFAULT 'public' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"jurisdiction" text,
	"effective_at" timestamp with time zone NOT NULL,
	"source_url" text NOT NULL,
	"license_note" text,
	"source_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_control_id" uuid NOT NULL,
	"target_control_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_update_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"manifest_hash" text NOT NULL,
	"signature" text NOT NULL,
	"artifact_inventory" jsonb NOT NULL,
	"network_dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_controls" ADD CONSTRAINT "assessment_controls_assessment_id_compliance_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."compliance_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_controls" ADD CONSTRAINT "assessment_controls_control_id_compliance_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."compliance_controls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_framework_id_compliance_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_qualified_reviewer_user_id_users_id_fk" FOREIGN KEY ("qualified_reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_controls" ADD CONSTRAINT "compliance_controls_framework_id_compliance_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_frameworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_mappings" ADD CONSTRAINT "control_mappings_source_control_id_compliance_controls_id_fk" FOREIGN KEY ("source_control_id") REFERENCES "public"."compliance_controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_mappings" ADD CONSTRAINT "control_mappings_target_control_id_compliance_controls_id_fk" FOREIGN KEY ("target_control_id") REFERENCES "public"."compliance_controls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_control_unique_idx" ON "assessment_controls" USING btree ("assessment_id","control_id");--> statement-breakpoint
CREATE INDEX "assessment_org_idx" ON "compliance_assessments" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "compliance_control_key_idx" ON "compliance_controls" USING btree ("framework_id","control_key");--> statement-breakpoint
CREATE UNIQUE INDEX "framework_version_idx" ON "compliance_frameworks" USING btree ("key","version");--> statement-breakpoint
CREATE UNIQUE INDEX "control_mapping_unique_idx" ON "control_mappings" USING btree ("source_control_id","target_control_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offline_bundle_version_idx" ON "offline_update_bundles" USING btree ("version");