CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."approval_type" AS ENUM('emergency_assignment', 'low_confidence_extraction', 'contract_rules', 'inspection_recommendation', 'replan');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('proposed', 'confirmed', 'started', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('active', 'pending_approval', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."contract_tier" AS ENUM('gold', 'silver', 'bronze');--> statement-breakpoint
CREATE TYPE "public"."event_autonomy" AS ENUM('auto', 'approved');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('open', 'scheduled', 'attention', 'late', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_urgency" AS ENUM('normal', 'high', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('queued', 'dry_run', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."skill_name" AS ENUM('elevator', 'refrigeration', 'chiller', 'split unit');--> statement-breakpoint
CREATE TYPE "public"."technician_status" AS ENUM('available', 'busy', 'late');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "approval_type" NOT NULL,
	"subject_type" varchar(100) NOT NULL,
	"subject_id" uuid,
	"context" jsonb NOT NULL,
	"reasoning" text NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"job_id" uuid,
	"outcome" text NOT NULL,
	"time_to_repair_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"install_date" date,
	"health_score" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" "assignment_status" DEFAULT 'proposed' NOT NULL,
	"cost" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"customer" varchar(255) NOT NULL,
	"source_pdf" text,
	"status" "contract_status" DEFAULT 'pending_approval' NOT NULL,
	"tier" "contract_tier" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duration_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_type" varchar(100) NOT NULL,
	"technician_id" uuid,
	"building_id" uuid,
	"median_minutes" integer NOT NULL,
	"p90_minutes" integer NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "duration_stats_scope_unique" UNIQUE("equipment_type","technician_id","building_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(100) NOT NULL,
	"subject_type" varchar(100) NOT NULL,
	"subject_id" uuid,
	"payload" jsonb NOT NULL,
	"reasoning" text NOT NULL,
	"autonomy" "event_autonomy" NOT NULL,
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"asset_id" uuid,
	"contract_id" uuid,
	"requester" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"equipment" varchar(100) NOT NULL,
	"skill_required" "skill_name" NOT NULL,
	"urgency" "job_urgency" DEFAULT 'normal' NOT NULL,
	"safety_flag" boolean DEFAULT false NOT NULL,
	"status" "job_status" DEFAULT 'open' NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"original_message" text NOT NULL,
	"notes" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sla_due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"channel" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "plan_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	"diff" jsonb NOT NULL,
	"reasons" jsonb NOT NULL,
	"impact" jsonb NOT NULL,
	"proposed_by" uuid,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auto_pilot" boolean DEFAULT false NOT NULL,
	"confidence_threshold" numeric(4, 3) DEFAULT '0.8' NOT NULL,
	"dry_run" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed" integer NOT NULL,
	"policy" varchar(100) NOT NULL,
	"sla_hit_rate" numeric(5, 4) NOT NULL,
	"travel_minutes" integer NOT NULL,
	"jobs_moved" integer NOT NULL,
	"is_simulated" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technician_id" uuid NOT NULL,
	"name" "skill_name" NOT NULL,
	"level" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_technician_name_unique" UNIQUE("technician_id","name")
);
--> statement-breakpoint
CREATE TABLE "sla_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"response_minutes" integer NOT NULL,
	"resolution_minutes" integer NOT NULL,
	"callback_cap" integer,
	"credit_terms" text,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_start" varchar(5) NOT NULL,
	"shift_end" varchar(5) NOT NULL,
	"status" "technician_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technicians_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duration_stats" ADD CONSTRAINT "duration_stats_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duration_stats" ADD CONSTRAINT "duration_stats_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_proposals" ADD CONSTRAINT "plan_proposals_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_proposals" ADD CONSTRAINT "plan_proposals_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_rules" ADD CONSTRAINT "sla_rules_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_rules" ADD CONSTRAINT "sla_rules_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approvals_status_idx" ON "approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approvals_subject_idx" ON "approvals" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "asset_events_asset_idx" ON "asset_events" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_events_job_idx" ON "asset_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "assets_building_idx" ON "assets" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "assignments_job_idx" ON "assignments" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "assignments_technician_start_idx" ON "assignments" USING btree ("technician_id","start_at");--> statement-breakpoint
CREATE INDEX "buildings_customer_idx" ON "buildings" USING btree ("customer");--> statement-breakpoint
CREATE INDEX "contracts_building_idx" ON "contracts" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "duration_stats_equipment_idx" ON "duration_stats" USING btree ("equipment_type");--> statement-breakpoint
CREATE INDEX "events_subject_time_idx" ON "events" USING btree ("subject_type","subject_id","created_at");--> statement-breakpoint
CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_sla_due_idx" ON "jobs" USING btree ("sla_due_at");--> statement-breakpoint
CREATE INDEX "jobs_building_idx" ON "jobs" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "jobs_contract_idx" ON "jobs" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "outbox_status_idx" ON "outbox" USING btree ("status");--> statement-breakpoint
CREATE INDEX "plan_proposals_status_idx" ON "plan_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "simulation_runs_created_at_idx" ON "simulation_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sla_rules_contract_idx" ON "sla_rules" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "technicians_status_idx" ON "technicians" USING btree ("status");