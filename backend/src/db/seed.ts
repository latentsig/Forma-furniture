import { products as sourceProducts } from '../../../frontend/src/catalog.ts';
import { sql as ormSql } from 'drizzle-orm';
import { db, sql } from './connection.ts';
import { products } from './schema.ts';

try {
  await db.transaction(async (transaction) => {
    for (let offset = 0; offset < sourceProducts.length; offset += 25) {
      const batch = sourceProducts.slice(offset, offset + 25).map((product) => ({
        id: product.id,
        slug: product.id,
        name: product.name,
        category: product.category,
        pricePaise: product.price * 100,
        material: product.material,
        description: product.description,
        image: product.image,
        size: product.size,
        lead: product.lead,
        gallery: product.gallery,
        isPublished: true,
        contentStatus: 'sample' as const,
      }));
      await transaction.insert(products).values(batch).onConflictDoUpdate({
        target: products.id,
        set: {
          slug: ormSql`excluded.slug`, name: ormSql`excluded.name`, category: ormSql`excluded.category`,
          pricePaise: ormSql`excluded.price_paise`, material: ormSql`excluded.material`,
          description: ormSql`excluded.description`, image: ormSql`excluded.image`, size: ormSql`excluded.size`,
          lead: ormSql`excluded.lead_time`, gallery: ormSql`excluded.gallery`, isPublished: ormSql`excluded.is_published`,
          contentStatus: ormSql`excluded.content_status`, updatedAt: ormSql`now()`,
        },
      });
    }
  });
  process.stdout.write(`Seeded ${sourceProducts.length} sample products in one transaction.\n`);
} finally {
  await sql.end();
}
