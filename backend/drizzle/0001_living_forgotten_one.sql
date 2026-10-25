CREATE TYPE "public"."admin_role" AS ENUM('OWNER', 'CATALOG_MANAGER', 'ORDER_MANAGER', 'SUPPORT', 'ANALYST');--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"actor_id" varchar(36),
	"action" varchar(120) NOT NULL,
	"target_id" varchar(160),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_salt" varchar(64) NOT NULL,
	"password_hash" varchar(128) NOT NULL,
	"totp_secret_encrypted" varchar(256) NOT NULL,
	"role" "admin_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_admin_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_actor_created_idx" ON "admin_audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_target_idx" ON "admin_audit_logs" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_user_expiry_idx" ON "admin_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "admin_users_active_role_idx" ON "admin_users" USING btree ("is_active","role");
