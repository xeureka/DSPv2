ALTER TYPE "public"."job_status" ADD VALUE 'received' BEFORE 'open';--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'triaged' BEFORE 'open';--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'proposed' BEFORE 'open';--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'assigned' BEFORE 'open';--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'en_route' BEFORE 'open';--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'on_site' BEFORE 'open';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "inbound_message_id" varchar(255);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_inbound_message_id_unique" UNIQUE("inbound_message_id");