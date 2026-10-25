import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { products } from './catalog.ts';
import { GET as getMedia } from './app/media/[...path]/route.ts';

test('catalogue migration retains all demo IDs and category totals', () => {
  equal(products.length, 100);
  equal(new Set(products.map((product) => product.id)).size, 100);
  deepStrictEqual(Object.fromEntries(['Seating', 'Tables', 'Bedroom', 'Storage'].map((category) => [category, products.filter((product) => product.category === category).length])), {
    Seating: 25, Tables: 25, Bedroom: 25, Storage: 25
  });
});

test('media route serves an original image and rejects traversal', async () => {
  const image = await getMedia(new Request('http://localhost/media/image%20assets/forma-lounge-original.png'), { params: Promise.resolve({ path: ['image assets', 'forma-lounge-original.png'] }) });
  equal(image.status, 200);
  equal(image.headers.get('Content-Type'), 'image/png');
  ok((await image.arrayBuffer()).byteLength > 0);
  const blocked = await getMedia(new Request('http://localhost/media/image%20assets/../README.md'), { params: Promise.resolve({ path: ['image assets', '..', 'README.md'] }) });
  equal(blocked.status, 404);
});

test('all three original gallery references for all 100 products still resolve', () => {
  let checked = 0;
  for (const product of products) {
    equal(product.gallery.length, 3, product.id);
    equal(product.gallery[0], product.image, product.id);
    for (const reference of product.gallery) {
      ok(reference.startsWith('image%20assets/'), `${product.id}: unexpected path ${reference}`);
      ok(existsSync(join('public', decodeURIComponent(reference))), `${product.id}: missing ${reference}`);
      checked += 1;
    }
  }
  equal(checked, 300);
});
