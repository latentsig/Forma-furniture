import { boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const productCategory = pgEnum('product_category', ['Seating', 'Tables', 'Bedroom', 'Storage']);
export const productContentStatus = pgEnum('product_content_status', ['sample', 'merchant_approved']);
export const adminRole = pgEnum('admin_role', ['OWNER', 'CATALOG_MANAGER', 'ORDER_MANAGER', 'SUPPORT', 'ANALYST']);
export const customerAuthTokenPurpose = pgEnum('customer_auth_token_purpose', ['email_verification', 'password_reset']);
export const commerceOrderStatus = pgEnum('commerce_order_status', ['placed', 'cancelled']);
export const commercePaymentMethod = pgEnum('commerce_payment_method', ['cod']);
export const commercePaymentStatus = pgEnum('commerce_payment_status', ['amount_due', 'collected', 'void']);
export type AdminRole = (typeof adminRole.enumValues)[number];

export const adminUsers = pgTable('admin_users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  passwordSalt: varchar('password_salt', { length: 64 }).notNull(),
  passwordHash: varchar('password_hash', { length: 128 }).notNull(),
  totpSecretEncrypted: varchar('totp_secret_encrypted', { length: 256 }).notNull(),
  role: adminRole('role').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  failedLoginCount: integer('failed_login_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('admin_users_active_role_idx').on(table.isActive, table.role)]);

export const adminSessions = pgTable('admin_sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('admin_sessions_user_expiry_idx').on(table.userId, table.expiresAt)]);

export const adminPasswordResetTokens = pgTable('admin_password_reset_tokens', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  adminId: varchar('admin_id', { length: 36 }).notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  recoveryTotpSecretEncrypted: varchar('recovery_totp_secret_encrypted', { length: 256 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('admin_password_reset_user_expiry_idx').on(table.adminId, table.expiresAt)]);

export const authRateLimitBuckets = pgTable('auth_rate_limit_buckets', {
  bucketKey: varchar('bucket_key', { length: 64 }).primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [index('auth_rate_limit_expiry_idx').on(table.expiresAt)]);

export const adminInvitations = pgTable('admin_invitations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 254 }).notNull(),
  role: adminRole('role').notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdBy: varchar('created_by', { length: 36 }).references(() => adminUsers.id, { onDelete: 'set null' }),
  passwordSalt: varchar('password_salt', { length: 64 }),
  passwordHash: varchar('password_hash', { length: 128 }),
  totpSecretEncrypted: varchar('totp_secret_encrypted', { length: 256 }),
  enrollmentTokenHash: varchar('enrollment_token_hash', { length: 64 }).unique(),
  enrollmentExpiresAt: timestamp('enrollment_expires_at', { withTimezone: true }),
  failedTotpAttempts: integer('failed_totp_attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  usedAt: timestamp('used_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('admin_invitations_open_email_unique').on(table.email).where(sql`${table.usedAt} IS NULL`),
  index('admin_invitations_expiry_idx').on(table.expiresAt),
]);

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  actorId: varchar('actor_id', { length: 36 }).references(() => adminUsers.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 120 }).notNull(),
  targetId: varchar('target_id', { length: 160 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('admin_audit_actor_created_idx').on(table.actorId, table.createdAt), index('admin_audit_target_idx').on(table.targetId)]);

export const customers = pgTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  passwordSalt: varchar('password_salt', { length: 64 }),
  passwordHash: varchar('password_hash', { length: 128 }),
  googleSubject: varchar('google_subject', { length: 255 }).unique(),
  facebookSubject: varchar('facebook_subject', { length: 255 }).unique(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('customers_created_idx').on(table.createdAt)]);

export const customerSessions = pgTable('customer_sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('customer_sessions_user_expiry_idx').on(table.customerId, table.expiresAt)]);

export const customerAuthTokens = pgTable('customer_auth_tokens', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  purpose: customerAuthTokenPurpose('purpose').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('customer_auth_tokens_user_purpose_idx').on(table.customerId, table.purpose)]);

export const customerOAuthNonces = pgTable('customer_oauth_nonces', {
  nonceHash: varchar('nonce_hash', { length: 64 }).primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('customer_oauth_nonce_expiry_idx').on(table.expiresAt)]);

export const products = pgTable('products', {
  id: varchar('id', { length: 120 }).primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  name: varchar('name', { length: 180 }).notNull(),
  category: productCategory('category').notNull(),
  pricePaise: integer('price_paise').notNull(),
  material: varchar('material', { length: 240 }).notNull(),
  description: text('description').notNull(),
  image: varchar('image', { length: 500 }).notNull(),
  size: varchar('size', { length: 240 }).notNull(),
  lead: varchar('lead_time', { length: 180 }).notNull(),
  gallery: text('gallery').array().notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  contentStatus: productContentStatus('content_status').notNull().default('sample'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('products_category_published_idx').on(table.category, table.isPublished),
  index('products_published_name_idx').on(table.isPublished, table.name),
]);

// Product ids act as the initial merchant SKU key until a reviewed variants/SKU
// model is introduced. Existing sample products get zero sellable inventory.
export const productInventory = pgTable('product_inventory', {
  productId: varchar('product_id', { length: 120 }).primaryKey().references(() => products.id, { onDelete: 'restrict' }),
  onHand: integer('on_hand').notNull().default(0),
  reserved: integer('reserved').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('product_inventory_available_idx').on(table.onHand, table.reserved),
  check('product_inventory_nonnegative', sql`${table.onHand} >= 0 AND ${table.reserved} >= 0 AND ${table.reserved} <= ${table.onHand}`),
]);

export const commerceCarts = pgTable('commerce_carts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  customerId: varchar('customer_id', { length: 36 }).references(() => customers.id, { onDelete: 'cascade' }),
  guestTokenHash: varchar('guest_token_hash', { length: 64 }).unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('commerce_carts_customer_unique').on(table.customerId).where(sql`${table.customerId} IS NOT NULL`),
  check('commerce_carts_one_owner', sql`(${table.customerId} IS NOT NULL AND ${table.guestTokenHash} IS NULL) OR (${table.customerId} IS NULL AND ${table.guestTokenHash} IS NOT NULL)`),
  index('commerce_carts_expiry_idx').on(table.expiresAt),
]);

export const commerceCartLines = pgTable('commerce_cart_lines', {
  id: varchar('id', { length: 36 }).primaryKey(),
  cartId: varchar('cart_id', { length: 36 }).notNull().references(() => commerceCarts.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 120 }).notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('commerce_cart_lines_cart_product_unique').on(table.cartId, table.productId),
  check('commerce_cart_lines_quantity_valid', sql`${table.quantity} >= 1 AND ${table.quantity} <= 99`),
  index('commerce_cart_lines_product_idx').on(table.productId),
]);

export const commerceQuotes = pgTable('commerce_quotes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  cartId: varchar('cart_id', { length: 36 }).notNull().references(() => commerceCarts.id, { onDelete: 'cascade' }),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  postcode: varchar('postcode', { length: 10 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('INR'),
  subtotalPaise: integer('subtotal_paise').notNull(),
  deliveryFeePaise: integer('delivery_fee_paise').notNull(),
  totalPaise: integer('total_paise').notNull(),
  linesSnapshot: jsonb('lines_snapshot').$type<Array<{ productId: string; name: string; quantity: number; unitPricePaise: number }>>().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('commerce_quotes_amounts_valid', sql`${table.subtotalPaise} >= 0 AND ${table.deliveryFeePaise} >= 0 AND ${table.totalPaise} = ${table.subtotalPaise} + ${table.deliveryFeePaise}`),
  index('commerce_quotes_owner_expiry_idx').on(table.customerId, table.expiresAt),
]);

export const commerceOrders = pgTable('commerce_orders', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderNumber: varchar('order_number', { length: 32 }).notNull().unique(),
  customerId: varchar('customer_id', { length: 36 }).notNull().references(() => customers.id, { onDelete: 'restrict' }),
  quoteId: varchar('quote_id', { length: 36 }).notNull().references(() => commerceQuotes.id, { onDelete: 'restrict' }),
  idempotencyKeyHash: varchar('idempotency_key_hash', { length: 64 }).notNull().unique(),
  status: commerceOrderStatus('status').notNull().default('placed'),
  paymentMethod: commercePaymentMethod('payment_method').notNull().default('cod'),
  paymentStatus: commercePaymentStatus('payment_status').notNull().default('amount_due'),
  currency: varchar('currency', { length: 3 }).notNull().default('INR'),
  subtotalPaise: integer('subtotal_paise').notNull(),
  deliveryFeePaise: integer('delivery_fee_paise').notNull(),
  totalPaise: integer('total_paise').notNull(),
  addressSnapshot: jsonb('address_snapshot').$type<{ fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; postcode: string }>().notNull(),
  fulfillmentConsentAt: timestamp('fulfillment_consent_at', { withTimezone: true }).notNull(),
  fulfillmentConsentVersion: varchar('fulfillment_consent_version', { length: 40 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('commerce_orders_amounts_valid', sql`${table.subtotalPaise} >= 0 AND ${table.deliveryFeePaise} >= 0 AND ${table.totalPaise} = ${table.subtotalPaise} + ${table.deliveryFeePaise}`),
  index('commerce_orders_customer_created_idx').on(table.customerId, table.createdAt),
  index('commerce_orders_status_created_idx').on(table.status, table.createdAt),
]);

export const commerceOrderLines = pgTable('commerce_order_lines', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => commerceOrders.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 120 }).notNull().references(() => products.id, { onDelete: 'restrict' }),
  skuSnapshot: varchar('sku_snapshot', { length: 120 }).notNull(),
  nameSnapshot: varchar('name_snapshot', { length: 180 }).notNull(),
  imageSnapshot: varchar('image_snapshot', { length: 500 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPricePaise: integer('unit_price_paise').notNull(),
  lineTotalPaise: integer('line_total_paise').notNull(),
}, (table) => [
  check('commerce_order_lines_amounts_valid', sql`${table.quantity} >= 1 AND ${table.quantity} <= 99 AND ${table.unitPricePaise} >= 0 AND ${table.lineTotalPaise} = ${table.quantity} * ${table.unitPricePaise}`),
  index('commerce_order_lines_order_idx').on(table.orderId),
]);

export const commerceReservations = pgTable('commerce_reservations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull().references(() => commerceOrders.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 120 }).notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('commerce_reservations_quantity_valid', sql`${table.quantity} >= 1`),
  index('commerce_reservations_expiry_idx').on(table.expiresAt, table.releasedAt),
]);

export type ProductRow = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
