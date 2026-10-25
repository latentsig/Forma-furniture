import { and, asc, count, desc, eq, ilike, or, sql as drizzleSql, type SQL } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { products, type ProductRow } from '../db/schema.ts';

export const productCategories = ['Seating', 'Tables', 'Bedroom', 'Storage'] as const;
export type ProductCategory = (typeof productCategories)[number];
export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name';

export type ProductQuery = {
  category?: ProductCategory;
  search?: string;
  sort: ProductSort;
  limit: number;
  offset: number;
};

export type ProductPage = {
  items: ProductRow[];
  total: number;
  limit: number;
  offset: number;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function listProducts(query: ProductQuery): Promise<ProductPage> {
  const conditions: SQL[] = [eq(products.isPublished, true)];
  if (query.category) conditions.push(eq(products.category, query.category));
  if (query.search) {
    const pattern = `%${escapeLike(query.search)}%`;
    conditions.push(or(ilike(products.name, pattern), ilike(products.material, pattern), ilike(drizzleSql`${products.category}::text`, pattern))!);
  }
  const where = and(...conditions);
  const order = query.sort === 'price-asc' ? [asc(products.pricePaise), asc(products.id)]
    : query.sort === 'price-desc' ? [desc(products.pricePaise), asc(products.id)]
      : query.sort === 'name' ? [asc(products.name), asc(products.id)]
        : [asc(products.id)];

  const [{ value: total }] = await db.select({ value: count() }).from(products).where(where);
  const items = await db.select().from(products).where(where).orderBy(...order).limit(query.limit).offset(query.offset);
  return { items, total, limit: query.limit, offset: query.offset };
}

export async function getPublishedProduct(idOrSlug: string) {
  const [product] = await db.select().from(products)
    .where(and(eq(products.isPublished, true), or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug))))
    .limit(1);
  return product ?? null;
}
