import { products } from './catalog';

export type CartLine = { productId: string; quantity: number };
const knownProductIds = new Set(products.map((product) => product.id));

function parseArray(value: string | null): unknown[] | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseCartStorage(currentValue: string | null, legacyValue: string | null, productIds = knownProductIds): CartLine[] {
  const entries = parseArray(currentValue) ?? parseArray(legacyValue) ?? [];
  const quantities = new Map<string, number>();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as { productId?: unknown; id?: unknown; quantity?: unknown };
    const productId = typeof candidate.productId === 'string' ? candidate.productId : candidate.id;
    const quantity = candidate.quantity;
    if (typeof productId !== 'string' || !productIds.has(productId)) continue;
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) continue;
    quantities.set(productId, Math.min(99, (quantities.get(productId) ?? 0) + quantity));
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}
