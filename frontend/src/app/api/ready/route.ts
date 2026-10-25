import { getFormaApiOrigin } from '@/server/api-origin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const response = await fetch(new URL('/ready', getFormaApiOrigin()), { cache: 'no-store', signal: AbortSignal.timeout(3_000) });
    if (!response.ok) return Response.json({ status: 'not-ready', dependency: 'commerce-api' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    const readiness: unknown = await response.json();
    if (!readiness || typeof readiness !== 'object' || !('database' in readiness) || readiness.database !== 'connected') {
      return Response.json({ status: 'not-ready', dependency: 'postgresql' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json({ status: 'ready', service: 'forma-web', dependencies: { commerceApi: 'connected', database: 'connected' } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ status: 'not-ready', dependency: 'commerce-api' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
