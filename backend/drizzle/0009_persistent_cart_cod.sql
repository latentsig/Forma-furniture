CREATE TYPE "commerce_order_status" AS ENUM ('placed', 'cancelled');--> statement-breakpoint
CREATE TYPE "commerce_payment_method" AS ENUM ('cod');--> statement-breakpoint
CREATE TYPE "commerce_payment_status" AS ENUM ('amount_due', 'collected', 'void');--> statement-breakpoint
CREATE TABLE "product_inventory" (
	"product_id" varchar(120) PRIMARY KEY NOT NULL,
	"on_hand" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_inventory_nonnegative" CHECK ("product_inventory"."on_hand" >= 0 AND "product_inventory"."reserved" >= 0 AND "product_inventory"."reserved" <= "product_inventory"."on_hand"),
	CONSTRAINT "product_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX "product_inventory_available_idx" ON "product_inventory" USING btree ("on_hand", "reserved");--> statement-breakpoint
INSERT INTO "product_inventory" ("product_id") SELECT "id" FROM "products" ON CONFLICT DO NOTHING;--> statement-breakpoint
CREATE FUNCTION "forma_create_product_inventory"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO "product_inventory" ("product_id") VALUES (NEW."id") ON CONFLICT DO NOTHING; RETURN NEW; END; $$;--> statement-breakpoint
CREATE TRIGGER "products_create_inventory" AFTER INSERT ON "products" FOR EACH ROW EXECUTE FUNCTION "forma_create_product_inventory"();--> statement-breakpoint
CREATE TABLE "commerce_carts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36),
	"guest_token_hash" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_carts_one_owner" CHECK (("customer_id" IS NOT NULL AND "guest_token_hash" IS NULL) OR ("customer_id" IS NULL AND "guest_token_hash" IS NOT NULL)),
	CONSTRAINT "commerce_carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_carts_customer_unique" ON "commerce_carts" USING btree ("customer_id") WHERE "customer_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_carts_guest_token_hash_unique" ON "commerce_carts" USING btree ("guest_token_hash");--> statement-breakpoint
CREATE INDEX "commerce_carts_expiry_idx" ON "commerce_carts" USING btree ("expires_at");--> statement-breakpoint
CREATE TABLE "commerce_cart_lines" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"cart_id" varchar(36) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_cart_lines_quantity_valid" CHECK ("commerce_cart_lines"."quantity" >= 1 AND "commerce_cart_lines"."quantity" <= 99),
	CONSTRAINT "commerce_cart_lines_cart_id_commerce_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."commerce_carts"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "commerce_cart_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_cart_lines_cart_product_unique" ON "commerce_cart_lines" USING btree ("cart_id", "product_id");--> statement-breakpoint
CREATE INDEX "commerce_cart_lines_product_idx" ON "commerce_cart_lines" USING btree ("product_id");--> statement-breakpoint
CREATE TABLE "commerce_quotes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"cart_id" varchar(36) NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"postcode" varchar(10) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"delivery_fee_paise" integer NOT NULL,
	"total_paise" integer NOT NULL,
	"lines_snapshot" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_quotes_amounts_valid" CHECK ("commerce_quotes"."subtotal_paise" >= 0 AND "commerce_quotes"."delivery_fee_paise" >= 0 AND "commerce_quotes"."total_paise" = "commerce_quotes"."subtotal_paise" + "commerce_quotes"."delivery_fee_paise"),
	CONSTRAINT "commerce_quotes_cart_id_commerce_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."commerce_carts"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "commerce_quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX "commerce_quotes_owner_expiry_idx" ON "commerce_quotes" USING btree ("customer_id", "expires_at");--> statement-breakpoint
CREATE TABLE "commerce_orders" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"order_number" varchar(32) NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"quote_id" varchar(36) NOT NULL,
	"idempotency_key_hash" varchar(64) NOT NULL,
	"status" "commerce_order_status" DEFAULT 'placed' NOT NULL,
	"payment_method" "commerce_payment_method" DEFAULT 'cod' NOT NULL,
	"payment_status" "commerce_payment_status" DEFAULT 'amount_due' NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"delivery_fee_paise" integer NOT NULL,
	"total_paise" integer NOT NULL,
	"address_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_orders_amounts_valid" CHECK ("commerce_orders"."subtotal_paise" >= 0 AND "commerce_orders"."delivery_fee_paise" >= 0 AND "commerce_orders"."total_paise" = "commerce_orders"."subtotal_paise" + "commerce_orders"."delivery_fee_paise"),
	CONSTRAINT "commerce_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action,
	CONSTRAINT "commerce_orders_quote_id_commerce_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."commerce_quotes"("id") ON DELETE restrict ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_orders_order_number_unique" ON "commerce_orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_orders_idempotency_key_hash_unique" ON "commerce_orders" USING btree ("idempotency_key_hash");--> statement-breakpoint
CREATE INDEX "commerce_orders_customer_created_idx" ON "commerce_orders" USING btree ("customer_id", "created_at");--> statement-breakpoint
CREATE INDEX "commerce_orders_status_created_idx" ON "commerce_orders" USING btree ("status", "created_at");--> statement-breakpoint
CREATE TABLE "commerce_order_lines" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"order_id" varchar(36) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"sku_snapshot" varchar(120) NOT NULL,
	"name_snapshot" varchar(180) NOT NULL,
	"image_snapshot" varchar(500) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"line_total_paise" integer NOT NULL,
	CONSTRAINT "commerce_order_lines_amounts_valid" CHECK ("commerce_order_lines"."quantity" >= 1 AND "commerce_order_lines"."quantity" <= 99 AND "commerce_order_lines"."unit_price_paise" >= 0 AND "commerce_order_lines"."line_total_paise" = "commerce_order_lines"."quantity" * "commerce_order_lines"."unit_price_paise"),
	CONSTRAINT "commerce_order_lines_order_id_commerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "commerce_order_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX "commerce_order_lines_order_idx" ON "commerce_order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE TABLE "commerce_reservations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"order_id" varchar(36) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"quantity" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commerce_reservations_quantity_valid" CHECK ("commerce_reservations"."quantity" >= 1),
	CONSTRAINT "commerce_reservations_order_id_commerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "commerce_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX "commerce_reservations_expiry_idx" ON "commerce_reservations" USING btree ("expires_at", "released_at");
