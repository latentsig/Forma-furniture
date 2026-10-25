CREATE TABLE "admin_password_reset_tokens" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"admin_id" varchar(36) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_password_reset_tokens" ADD CONSTRAINT "admin_password_reset_tokens_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_password_reset_user_expiry_idx" ON "admin_password_reset_tokens" USING btree ("admin_id","expires_at");