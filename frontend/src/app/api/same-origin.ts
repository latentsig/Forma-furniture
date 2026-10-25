import type { NextRequest } from 'next/server';

/**
 * Next's request URL may be normalized to localhost while a local browser is
 * using 127.0.0.1 (and a reverse proxy can expose a forwarded host). Compare
 * the browser Origin to the incoming host values instead of only request.url.
 */
export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  const requestUrl = new URL(request.url);
  const protocol = (request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || requestUrl.protocol.slice(0, -1)).toLowerCase();
  const hosts = [
    request.headers.get('host'),
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim(),
  ].filter((host): host is string => Boolean(host));

  const expectedOrigins = new Set<string>([requestUrl.origin]);
  for (const host of hosts) {
    try {
      expectedOrigins.add(new URL(`${protocol}://${host}`).origin);
    } catch {
      // Ignore malformed host headers; the other validated host may still match.
    }
  }

  return expectedOrigins.has(origin);
}
