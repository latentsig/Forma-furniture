ALTER TABLE "commerce_orders" ADD COLUMN "fulfillment_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce_orders" ADD COLUMN "fulfillment_consent_version" varchar(40);--> statement-breakpoint
UPDATE "commerce_orders" SET "fulfillment_consent_at" = "created_at", "fulfillment_consent_version" = 'delivery-fulfillment-v1' WHERE "fulfillment_consent_at" IS NULL OR "fulfillment_consent_version" IS NULL;--> statement-breakpoint
ALTER TABLE "commerce_orders" ALTER COLUMN "fulfillment_consent_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce_orders" ALTER COLUMN "fulfillment_consent_version" SET NOT NULL;
