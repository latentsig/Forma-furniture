CREATE TYPE "public"."customer_auth_token_purpose" AS ENUM('email_verification', 'password_reset');--> statement-breakpoint
CREATE TABLE "customer_auth_tokens" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"purpose" "customer_auth_token_purpose" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"phone" varchar(32),
	"password_salt" varchar(64),
	"password_hash" varchar(128),
	"google_subject" varchar(255),
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email"),
	CONSTRAINT "customers_google_subject_unique" UNIQUE("google_subject")
);
--> statement-breakpoint
ALTER TABLE "customer_auth_tokens" ADD CONSTRAINT "customer_auth_tokens_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_auth_tokens_user_purpose_idx" ON "customer_auth_tokens" USING btree ("customer_id","purpose");--> statement-breakpoint
CREATE INDEX "customer_sessions_user_expiry_idx" ON "customer_sessions" USING btree ("customer_id","expires_at");--> statement-breakpoint
CREATE INDEX "customers_created_idx" ON "customers" USING btree ("created_at");