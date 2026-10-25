import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { sql } from './db/connection.ts';
import { createCommerceServer } from './server.ts';
import { listProducts } from './catalog/product-service.ts';

const server = createCommerceServer();
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('Test server did not bind to a TCP port.'));
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await sql.end();
});

test('health and readiness distinguish process status from database connectivity', async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', service: 'forma-commerce-api' });
  const readiness = await fetch(`${baseUrl}/ready`);
  assert.equal(readiness.status, 200);
  assert.deepEqual(await readiness.json(), { status: 'ready', database: 'connected' });
});

test('migrated product records are typed, sample-labelled, and paginated', async () => {
  const response = await fetch(`${baseUrl}/api/products?limit=100`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json() as { total: number; limit: number; offset: number; items: Array<{ id: string; pricePaise: number; contentStatus: string }> };
  assert.equal(result.total, 100);
  assert.equal(result.items.length, 100);
  assert.equal(result.limit, 100);
  assert.equal(result.offset, 0);
  assert.ok(result.items.every((item) => item.contentStatus === 'sample'));
  assert.equal(result.items.find((item) => item.id === 'forma-001-sunday-oak-lounge-chair')?.pricePaise, 2_800_000);
});

test('category/search filters are parameterized and wildcard characters stay literal', async () => {
  const seating = await listProducts({ category: 'Seating', sort: 'featured', limit: 100, offset: 0 });
  assert.equal(seating.total, 25);
  const search = await fetch(`${baseUrl}/api/products?search=sunday&limit=100`);
  const matching = await search.json() as { total: number; items: Array<{ name: string }> };
  assert.equal(matching.total, 1);
  assert.equal(matching.items[0].name, 'Sunday Oak Lounge Chair');
  const wildcard = await fetch(`${baseUrl}/api/products?search=%25&limit=100`);
  assert.equal((await wildcard.json() as { total: number }).total, 0);
});

test('sort orders use persisted paise values with deterministic tie breaks', async () => {
  const low = await fetch(`${baseUrl}/api/products?sort=price-asc&limit=100`);
  const lowRows = (await low.json() as { items: Array<{ pricePaise: number }> }).items;
  assert.ok(lowRows.every((item, index) => index === 0 || lowRows[index - 1].pricePaise <= item.pricePaise));
  const high = await fetch(`${baseUrl}/api/products?sort=price-desc&limit=100`);
  const highRows = (await high.json() as { items: Array<{ pricePaise: number }> }).items;
  assert.ok(highRows.every((item, index) => index === 0 || highRows[index - 1].pricePaise >= item.pricePaise));
});

test('product detail resolves stable IDs and slugs and returns 404 for unknown products', async () => {
  const byId = await fetch(`${baseUrl}/api/products/forma-001-sunday-oak-lounge-chair`);
  assert.equal(byId.status, 200);
  const product = await byId.json() as { id: string; slug: string; gallery: string[] };
  assert.equal(product.id, product.slug);
  assert.equal(product.gallery.length, 3);
  const bySlug = await fetch(`${baseUrl}/api/products/${product.slug}`);
  assert.equal(bySlug.status, 200);
  const missing = await fetch(`${baseUrl}/api/products/not-a-product`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Product not found.' });
});

test('invalid parameters and unapproved cross-origin requests are rejected', async () => {
  for (const query of ['category=Unknown', 'limit=101', 'offset=-1', 'sort=discount']) {
    const response = await fetch(`${baseUrl}/api/products?${query}`);
    assert.equal(response.status, 400, query);
  }
  const forbidden = await fetch(`${baseUrl}/api/products`, { headers: { Origin: 'https://not-approved.example' } });
  assert.equal(forbidden.status, 403);
  const preflight = await fetch(`${baseUrl}/api/products`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});
