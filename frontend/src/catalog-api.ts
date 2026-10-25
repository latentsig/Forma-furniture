import type { Category, Product } from './catalog';

type ApiProduct = {
  id: string; name: string; category: Category; pricePaise: number; material: string;
  description: string; image: string; size: string; lead: string; gallery: string[];
  isPublished: boolean; contentStatus: 'sample' | 'merchant_approved';
};
type ApiProductPage = { items: ApiProduct[]; total: number; limit: number; offset: number };

function isApiProduct(value: unknown): value is ApiProduct {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ApiProduct>;
  return typeof item.id === 'string' && typeof item.name === 'string' &&
    ['Seating', 'Tables', 'Bedroom', 'Storage'].includes(item.category ?? '') &&
    typeof item.pricePaise === 'number' && Number.isSafeInteger(item.pricePaise) && item.pricePaise >= 0 &&
    typeof item.material === 'string' && typeof item.description === 'string' &&
    typeof item.image === 'string' && typeof item.size === 'string' && typeof item.lead === 'string' &&
    Array.isArray(item.gallery) && item.gallery.every((image) => typeof image === 'string') &&
    typeof item.isPublished === 'boolean' && (item.contentStatus === 'sample' || item.contentStatus === 'merchant_approved');
}

function toProduct(item: ApiProduct): Product {
  return {
    id: item.id, name: item.name, category: item.category, price: item.pricePaise / 100,
    material: item.material, description: item.description, image: item.image,
    size: item.size, lead: item.lead, gallery: item.gallery,
  };
}

export async function getCatalog(): Promise<Product[]> {
  const baseUrl = process.env.FORMA_API_URL ?? 'http://127.0.0.1:4100';
  const items: ApiProduct[] = [];
  let total: number | undefined;
  for (let offset = 0; total === undefined || offset < total; offset += 100) {
    const response = await fetch(new URL(`/api/products?sort=featured&limit=100&offset=${offset}`, baseUrl), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Catalog service returned ${response.status}`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') throw new Error('Catalog service returned an invalid page');
    const page = payload as Partial<ApiProductPage>;
    if (!Array.isArray(page.items) || !page.items.every(isApiProduct) || typeof page.total !== 'number' || !Number.isSafeInteger(page.total) || page.total < 0 ||
        page.limit !== 100 || page.offset !== offset || (total !== undefined && page.total !== total)) {
      throw new Error('Catalog service returned an incomplete or invalid catalogue page');
    }
    const pageTotal = page.total;
    total = pageTotal;
    if (items.length + page.items.length > pageTotal || (offset < pageTotal && page.items.length === 0)) {
      throw new Error('Catalog service returned inconsistent pagination');
    }
    items.push(...page.items);
  }
  if (total !== items.length || new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error('Catalog service returned an incomplete or duplicate catalogue');
  }
  return items.map(toProduct);
}

export async function getCatalogProduct(id: string): Promise<Product | null> {
  const baseUrl = process.env.FORMA_API_URL ?? 'http://127.0.0.1:4100';
  const response = await fetch(new URL(`/api/products/${encodeURIComponent(id)}`, baseUrl), { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Catalog service returned ${response.status}`);
  const payload: unknown = await response.json();
  if (!isApiProduct(payload)) throw new Error('Catalog service returned an invalid product');
  return toProduct(payload);
}
