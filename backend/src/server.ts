import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import { sql } from './db/connection.ts';
import { getPublishedProduct, listProducts, productCategories, type ProductSort } from './catalog/product-service.ts';

const port = Number(process.env.PORT ?? 4100);
const allowedOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const sorts: ProductSort[] = ['featured', 'price-asc', 'price-desc', 'name'];

function sendJson(response: ServerResponse, status: number, body: unknown, cache = 'no-store') {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(JSON.stringify(body));
}

function cors(request: IncomingMessage, response: ServerResponse) {
  const origin = request.headers.origin;
  if (origin && origin !== allowedOrigin) {
    sendJson(response, 403, { error: 'Origin not allowed' });
    return false;
  }
  response.setHeader('Vary', 'Origin');
  if (origin === allowedOrigin) response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  return true;
}

function parseQuery(url: URL) {
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search')?.trim() || undefined;
  const sort = url.searchParams.get('sort') ?? 'featured';
  const limitText = url.searchParams.get('limit') ?? '24';
  const offsetText = url.searchParams.get('offset') ?? '0';
  const limit = Number(limitText);
  const offset = Number(offsetText);
  if (category && !productCategories.includes(category as (typeof productCategories)[number])) return { error: 'Invalid product category.' } as const;
  if (search && search.length > 120) return { error: 'Search must be 120 characters or fewer.' } as const;
  if (!sorts.includes(sort as ProductSort)) return { error: 'Invalid sort order.' } as const;
  if (!/^\d+$/.test(limitText) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return { error: 'Limit must be an integer between 1 and 100.' } as const;
  if (!/^\d+$/.test(offsetText) || !Number.isSafeInteger(offset) || offset > 100_000) return { error: 'Offset must be an integer between 0 and 100000.' } as const;
  return { query: { category: category as (typeof productCategories)[number] | undefined, search, sort: sort as ProductSort, limit, offset } } as const;
}

export function createCommerceServer(): Server {
  return createServer(async (request, response) => {
    if (!cors(request, response)) return;
    if (request.method === 'OPTIONS') {
      response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
      response.end();
      return;
    }

    let url: URL;
    try {
      url = new URL(request.url ?? '/', 'http://localhost');
    } catch {
      sendJson(response, 400, { error: 'Invalid request URL.' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok', service: 'forma-commerce-api' });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/ready') {
      try {
        await sql`select 1`;
        sendJson(response, 200, { status: 'ready', database: 'connected' });
      } catch {
        sendJson(response, 503, { status: 'not-ready', database: 'unavailable' });
      }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/products') {
      const parsed = parseQuery(url);
      if ('error' in parsed) {
        sendJson(response, 400, { error: parsed.error });
        return;
      }
      try {
        const page = await listProducts(parsed.query);
        sendJson(response, 200, page);
      } catch {
        sendJson(response, 503, { error: 'Product data is temporarily unavailable.' });
      }
      return;
    }
    const productPath = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (request.method === 'GET' && productPath) {
      let idOrSlug: string;
      try {
        idOrSlug = decodeURIComponent(productPath[1]);
      } catch {
        sendJson(response, 400, { error: 'Invalid product identifier.' });
        return;
      }
      if (idOrSlug.length > 160) {
        sendJson(response, 400, { error: 'Product identifier is too long.' });
        return;
      }
      try {
        const product = await getPublishedProduct(idOrSlug);
        if (!product) {
          sendJson(response, 404, { error: 'Product not found.' });
          return;
        }
        sendJson(response, 200, product);
      } catch {
        sendJson(response, 503, { error: 'Product data is temporarily unavailable.' });
      }
      return;
    }
    sendJson(response, 404, { error: 'Route not found.' });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createCommerceServer();
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`Forma TypeScript commerce API listening on 127.0.0.1:${port}\n`);
  });

  function shutdown(signal: string) {
    server.close(() => {
      void sql.end().finally(() => {
        process.stdout.write(`Commerce API closed after ${signal}.\n`);
        process.exitCode = 0;
      });
    });
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}
