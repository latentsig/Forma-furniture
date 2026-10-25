import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '../../same-origin';
import { getFormaApiOrigin } from '@/server/api-origin';

const guestCookieName = 'forma_guest_cart';
const customerCookieName = 'forma_customer_session';
type RouteContext = { params: Promise<{ path: string[] }> };
const allowedRoutes = new Set(['cart', 'cart/lines', 'quotes', 'orders']);

async function proxy(request: NextRequest, context: RouteContext, method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
  if (method !== 'GET' && !isSameOriginRequest(request)) return NextResponse.json({ error: 'Same-origin request required.' }, { status: 403 });
  const { path } = await context.params;
  const action = path.join('/');
  if (!allowedRoutes.has(action) || path.length < 1 || path.length > 2) return NextResponse.json({ error: 'Route not found.' }, { status: 404 });
  const jar = await cookies();
  const guestCookie = jar.get(guestCookieName)?.value;
  const guestToken = guestCookie && /^[A-Za-z0-9_-]{32,128}$/.test(guestCookie) ? guestCookie : randomBytes(32).toString('base64url');
  const customerToken = jar.get(customerCookieName)?.value;
  let payload: unknown;
  if (method === 'POST' || method === 'PUT') {
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  }
  try {
    const upstream = await fetch(new URL(`/api/commerce/${action}`, getFormaApiOrigin()), {
      method, cache: 'no-store',
      headers: {
        'X-Forma-Guest-Cart': guestToken,
        ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        ...(method === 'POST' || method === 'PUT' ? { 'Content-Type': 'application/json' } : {}),
        ...(request.headers.get('idempotency-key') ? { 'Idempotency-Key': request.headers.get('idempotency-key')! } : {}),
      },
      ...(method === 'POST' || method === 'PUT' ? { body: JSON.stringify(payload) } : {}),
    });
    const data: unknown = await upstream.json().catch(() => ({ error: 'Commerce service returned an invalid response.' }));
    const response = NextResponse.json(data, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    if (!guestCookie || guestToken !== guestCookie) response.cookies.set(guestCookieName, guestToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/commerce', maxAge: 30 * 24 * 60 * 60 });
    return response;
  } catch {
    return NextResponse.json({ error: 'Commerce service is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = (request: NextRequest, context: RouteContext) => proxy(request, context, 'GET');
export const POST = (request: NextRequest, context: RouteContext) => proxy(request, context, 'POST');
export const PUT = (request: NextRequest, context: RouteContext) => proxy(request, context, 'PUT');
export const DELETE = (request: NextRequest, context: RouteContext) => proxy(request, context, 'DELETE');
