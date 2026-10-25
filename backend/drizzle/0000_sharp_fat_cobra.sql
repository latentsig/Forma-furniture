CREATE TYPE "public"."product_category" AS ENUM('Seating', 'Tables', 'Bedroom', 'Storage');--> statement-breakpoint
CREATE TYPE "public"."product_content_status" AS ENUM('sample', 'merchant_approved');--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(180) NOT NULL,
	"category" "product_category" NOT NULL,
	"price_paise" integer NOT NULL,
	"material" varchar(240) NOT NULL,
	"description" text NOT NULL,
	"image" varchar(500) NOT NULL,
	"size" varchar(240) NOT NULL,
	"lead_time" varchar(180) NOT NULL,
	"gallery" text[] NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"content_status" "product_content_status" DEFAULT 'sample' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "products_category_published_idx" ON "products" USING btree ("category","is_published");--> statement-breakpoint
CREATE INDEX "products_published_name_idx" ON "products" USING btree ("is_published","name");