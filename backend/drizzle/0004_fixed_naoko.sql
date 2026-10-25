CREATE TABLE "admin_invitations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"role" "admin_role" NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" varchar(36),
	"password_salt" varchar(64),
	"password_hash" varchar(128),
	"totp_secret_encrypted" varchar(256),
	"enrollment_token_hash" varchar(64),
	"enrollment_expires_at" timestamp with time zone,
	"failed_totp_attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "admin_invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "admin_invitations_enrollment_token_hash_unique" UNIQUE("enrollment_token_hash")
);
--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_invitations_open_email_unique" ON "admin_invitations" USING btree ("email") WHERE "admin_invitations"."used_at" IS NULL;--> statement-breakpoint
CREATE INDEX "admin_invitations_expiry_idx" ON "admin_invitations" USING btree ("expires_at");