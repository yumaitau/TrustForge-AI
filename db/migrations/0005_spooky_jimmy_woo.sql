CREATE TYPE "public"."classification" AS ENUM('public', 'internal', 'confidential', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."decision_type" AS ENUM('approve', 'reject', 'request_changes', 'grant_exception');--> statement-breakpoint
CREATE TYPE "public"."procurement_status" AS ENUM('draft', 'submitted', 'assessing', 'approved', 'rejected', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "audit_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"scope" jsonb NOT NULL,
	"manifest_hash" text NOT NULL,
	"signature" text NOT NULL,
	"storage_key" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalogue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalogue_id" uuid NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"status" "procurement_status" DEFAULT 'draft' NOT NULL,
	"internal_notes" text,
	"renewal_at" timestamp with time zone,
	"exception_expires_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_catalogues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_approval_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"title" text NOT NULL,
	"classification" "classification" DEFAULT 'internal' NOT NULL,
	"content_hash" text NOT NULL,
	"storage_key" text NOT NULL,
	"source_evidence_id" uuid,
	"expires_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"reason" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"released_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"version" text NOT NULL,
	"body_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"supersedes_policy_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"control_key" text NOT NULL,
	"subject_type" "subject_type",
	"subject_id" uuid,
	"evidence_library_item_id" uuid,
	"rationale" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurement_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"decision" "decision_type" NOT NULL,
	"rationale" text NOT NULL,
	"evidence_ids" text[] DEFAULT '{}' NOT NULL,
	"policy_mapping_ids" text[] DEFAULT '{}' NOT NULL,
	"exception_expires_at" timestamp with time zone,
	"decided_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurement_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"catalogue_entry_id" uuid,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"title" text NOT NULL,
	"business_justification" text NOT NULL,
	"risk_summary" text,
	"status" "procurement_status" DEFAULT 'draft' NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_exports" ADD CONSTRAINT "audit_exports_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_exports" ADD CONSTRAINT "audit_exports_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_entries" ADD CONSTRAINT "catalogue_entries_catalogue_id_enterprise_catalogues_id_fk" FOREIGN KEY ("catalogue_id") REFERENCES "public"."enterprise_catalogues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_entries" ADD CONSTRAINT "catalogue_entries_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_catalogues" ADD CONSTRAINT "enterprise_catalogues_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_library_items" ADD CONSTRAINT "evidence_library_items_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_library_items" ADD CONSTRAINT "evidence_library_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_released_by_user_id_users_id_fk" FOREIGN KEY ("released_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_mappings" ADD CONSTRAINT "policy_mappings_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_mappings" ADD CONSTRAINT "policy_mappings_evidence_library_item_id_evidence_library_items_id_fk" FOREIGN KEY ("evidence_library_item_id") REFERENCES "public"."evidence_library_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_mappings" ADD CONSTRAINT "policy_mappings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_decisions" ADD CONSTRAINT "procurement_decisions_request_id_procurement_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."procurement_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_decisions" ADD CONSTRAINT "procurement_decisions_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_catalogue_entry_id_catalogue_entries_id_fk" FOREIGN KEY ("catalogue_entry_id") REFERENCES "public"."catalogue_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_export_org_time_idx" ON "audit_exports" USING btree ("organisation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "catalogue_entry_subject_idx" ON "catalogue_entries" USING btree ("catalogue_id","subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "catalogue_entry_renewal_idx" ON "catalogue_entries" USING btree ("renewal_at");--> statement-breakpoint
CREATE UNIQUE INDEX "enterprise_catalogue_name_idx" ON "enterprise_catalogues" USING btree ("organisation_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_library_hash_idx" ON "evidence_library_items" USING btree ("organisation_id","content_hash");--> statement-breakpoint
CREATE INDEX "evidence_library_classification_idx" ON "evidence_library_items" USING btree ("organisation_id","classification");--> statement-breakpoint
CREATE INDEX "legal_hold_org_active_idx" ON "legal_holds" USING btree ("organisation_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_version_idx" ON "policies" USING btree ("organisation_id","key","version");--> statement-breakpoint
CREATE INDEX "policy_mapping_policy_idx" ON "policy_mappings" USING btree ("policy_id","control_key");--> statement-breakpoint
CREATE INDEX "procurement_decision_request_idx" ON "procurement_decisions" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "procurement_request_org_status_idx" ON "procurement_requests" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX "procurement_request_subject_idx" ON "procurement_requests" USING btree ("subject_type","subject_id");