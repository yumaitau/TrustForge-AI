CREATE TYPE "public"."alert_kind" AS ENUM('score_drop', 'new_finding', 'verification_change');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('queued', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mobile_platform" AS ENUM('ios', 'android');--> statement-breakpoint
CREATE TABLE "alert_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"score_drops" boolean DEFAULT true NOT NULL,
	"new_findings" boolean DEFAULT true NOT NULL,
	"verification_changes" boolean DEFAULT false NOT NULL,
	"min_severity" "security_severity" DEFAULT 'high' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobile_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "mobile_platform" NOT NULL,
	"device_name" text,
	"push_token" text NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"app_version" text,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobile_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_type" "subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"kind" "alert_kind" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "alert_status" DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_devices" ADD CONSTRAINT "mobile_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_favorites" ADD CONSTRAINT "mobile_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_alerts" ADD CONSTRAINT "trust_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_preference_subject_idx" ON "alert_preferences" USING btree ("user_id","subject_type","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mobile_device_token_idx" ON "mobile_devices" USING btree ("user_id","push_token");--> statement-breakpoint
CREATE UNIQUE INDEX "mobile_favorite_subject_idx" ON "mobile_favorites" USING btree ("user_id","subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "trust_alert_user_status_idx" ON "trust_alerts" USING btree ("user_id","status","created_at");