import { describe, expect, it } from 'vitest';
import { products } from './catalog';
import { parseCartStorage } from './cart';

describe('migrated furniture catalogue', () => {
  it('preserves all 100 distinct demo products and four category counts', () => {
    expect(products).toHaveLength(100);
    expect(new Set(products.map((product) => product.id)).size).toBe(100);
    expect(Object.fromEntries(['Seating', 'Tables', 'Bedroom', 'Storage'].map((category) => [
      category,
      products.filter((product) => product.category === category).length
    ]))).toEqual({ Seating: 25, Tables: 25, Bedroom: 25, Storage: 25 });
  });

  it('keeps each original gallery and image reference', () => {
    for (const product of products) {
      expect(product.gallery).toHaveLength(3);
      expect(product.gallery[0]).toBe(product.image);
    expect(product.image).toMatch(/^image%20assets\//);
    }
  });
});

describe('safe demo-cart migration', () => {
  it('migrates only known product IDs and bounded quantities from the old bag', () => {
    const oldBag = JSON.stringify([{ id: products[0].id, name: 'ignored', price: -1, image: 'ignored', quantity: 2 }, { id: 'unknown', quantity: 1 }, { id: products[1].id, quantity: 100 }]);
    expect(parseCartStorage(null, oldBag)).toEqual([{ productId: products[0].id, quantity: 2 }]);
  });

  it('prefers a valid new bag and ignores injected or malformed entries', () => {
    const current = JSON.stringify([{ productId: products[2].id, quantity: 1 }, { productId: '"><img src=x>', quantity: 1 }]);
    expect(parseCartStorage(current, JSON.stringify([{ id: products[0].id, quantity: 4 }]))).toEqual([{ productId: products[2].id, quantity: 1 }]);
    expect(parseCartStorage('{broken', null)).toEqual([]);
  });
});
