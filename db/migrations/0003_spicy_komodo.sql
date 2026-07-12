CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"capabilities" text[] DEFAULT '{}' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"autonomy_level" integer DEFAULT 1 NOT NULL,
	"deployment_modes" text[] DEFAULT '{}' NOT NULL,
	"model_dependencies" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"base_url" text NOT NULL,
	"authentication_methods" text[] DEFAULT '{}' NOT NULL,
	"protocols" text[] DEFAULT '{"https"}' NOT NULL,
	"data_residency_regions" text[] DEFAULT '{}' NOT NULL,
	"retention_summary" text,
	"training_usage" text,
	"sla_url" text,
	"pricing_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"ecosystem" text NOT NULL,
	"package_name" text NOT NULL,
	"version_range" text,
	"direct" boolean DEFAULT true NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"version" text NOT NULL,
	"release_url" text,
	"commit_sha" text,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"sbom_url" text,
	"published_at" timestamp with time zone NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"publisher_company_id" uuid,
	"maintainer" text,
	"repository_url" text,
	"documentation_url" text,
	"package_identifier" text,
	"transports" text[] DEFAULT '{}' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"authentication_methods" text[] DEFAULT '{}' NOT NULL,
	"secrets_required" text[] DEFAULT '{}' NOT NULL,
	"oauth_supported" boolean DEFAULT false NOT NULL,
	"sandbox_compatible" boolean DEFAULT false NOT NULL,
	"enterprise_ready" boolean DEFAULT false NOT NULL,
	"maintenance_status" text DEFAULT 'unknown' NOT NULL,
	"manifest_version" text DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"family" text NOT NULL,
	"provider_model_id" text NOT NULL,
	"modalities" text[] DEFAULT '{}' NOT NULL,
	"context_window" integer,
	"open_weights" boolean DEFAULT false NOT NULL,
	"license" text,
	"training_data_summary" text,
	"safety_documentation_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"format" text NOT NULL,
	"version" text,
	"manifest" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"capabilities" text[] DEFAULT '{}' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"compatible_hosts" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_offerings" ADD CONSTRAINT "api_offerings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_dependencies" ADD CONSTRAINT "mcp_dependencies_mcp_server_id_mcp_servers_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_releases" ADD CONSTRAINT "mcp_releases_mcp_server_id_mcp_servers_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_publisher_company_id_companies_id_fk" FOREIGN KEY ("publisher_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agents_product_idx" ON "agents" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_product_idx" ON "api_offerings" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_base_url_idx" ON "api_offerings" USING btree ("base_url");--> statement-breakpoint
CREATE INDEX "mcp_dependency_server_idx" ON "mcp_dependencies" USING btree ("mcp_server_id");--> statement-breakpoint
CREATE INDEX "mcp_dependency_package_idx" ON "mcp_dependencies" USING btree ("ecosystem","package_name");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_release_version_idx" ON "mcp_releases" USING btree ("mcp_server_id","version");--> statement-breakpoint
CREATE INDEX "mcp_release_time_idx" ON "mcp_releases" USING btree ("mcp_server_id","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_product_idx" ON "mcp_servers" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_package_idx" ON "mcp_servers" USING btree ("package_identifier");--> statement-breakpoint
CREATE INDEX "mcp_publisher_idx" ON "mcp_servers" USING btree ("publisher_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "models_product_idx" ON "models" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "models_provider_id_idx" ON "models" USING btree ("provider_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_product_idx" ON "skills" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "skills_format_idx" ON "skills" USING btree ("format");