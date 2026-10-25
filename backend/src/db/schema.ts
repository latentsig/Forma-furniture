import { boolean, index, integer, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const productCategory = pgEnum('product_category', ['Seating', 'Tables', 'Bedroom', 'Storage']);
export const productContentStatus = pgEnum('product_content_status', ['sample', 'merchant_approved']);

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

export type ProductRow = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
