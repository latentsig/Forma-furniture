CREATE TABLE "customer_oauth_nonces" (
	"nonce_hash" varchar(64) PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "customer_oauth_nonce_expiry_idx" ON "customer_oauth_nonces" USING btree ("expires_at");