import { productCategories } from './product-service.ts';
import { products } from '../db/schema.ts';

export type AdminProductInput = typeof products.$inferInsert;

export function validateProductInput(value: unknown): AdminProductInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const allowed = new Set(['id', 'slug', 'name', 'category', 'pricePaise', 'material', 'description', 'image', 'size', 'lead', 'gallery', 'isPublished']);
  if (Object.keys(record).some((key) => !allowed.has(key))) return null;
  const stringFields = ['id', 'slug', 'name', 'material', 'description', 'image', 'size', 'lead'] as const;
  if (stringFields.some((field) => typeof record[field] !== 'string')) return null;
  const lengths: Record<(typeof stringFields)[number], number> = { id: 120, slug: 160, name: 180, material: 240, description: 8000, image: 500, size: 240, lead: 180 };
  if (stringFields.some((field) => (record[field] as string).trim().length === 0 || (record[field] as string).length > lengths[field])) return null;
  if (typeof record.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(record.id) || typeof record.slug !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(record.slug)) return null;
  if (!productCategories.includes(record.category as (typeof productCategories)[number])) return null;
  if (typeof record.pricePaise !== 'number' || !Number.isSafeInteger(record.pricePaise) || record.pricePaise < 1 || record.pricePaise > 2_000_000_000) return null;
  if (typeof record.image !== 'string' || !isSafeAssetPath(record.image)) return null;
  if (!Array.isArray(record.gallery) || record.gallery.length < 1 || record.gallery.length > 12 || record.gallery.some((item) => typeof item !== 'string' || item.length > 500 || !isSafeAssetPath(item))) return null;
  if (record.isPublished !== undefined && typeof record.isPublished !== 'boolean') return null;
  return record as unknown as AdminProductInput;
}

function isSafeAssetPath(value: string) {
  if (!value || value.startsWith('/') || value.includes('\\') || /^[a-z][a-z\d+.-]*:/i.test(value) || /[\u0000-\u001f]/.test(value)) return false;
  let decoded = value;
  try { for (let index = 0; index < 3; index += 1) decoded = decodeURIComponent(decoded); }
  catch { return false; }
  return !decoded.split('/').some((segment) => segment === '..' || segment === '.') && !decoded.startsWith('/');
}
