ALTER TABLE "usuarios" ADD COLUMN "google_access_token" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "google_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "outlook_access_token" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "outlook_refresh_token" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "outlook_token_expires_at" timestamp;