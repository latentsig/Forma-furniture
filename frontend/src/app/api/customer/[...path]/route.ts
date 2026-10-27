import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '../../same-origin';
import { getFormaApiOrigin } from '@/server/api-origin';

const cookieName = 'forma_customer_session';
type RouteContext = { params: Promise<{ path: string[] }> };
const allowedPaths = new Set(['register', 'verify-email', 'request-email-verification', 'login', 'forgot-password', 'reset-password', 'google', 'facebook', 'session', 'profile']);

async function proxy(request: NextRequest, context: RouteContext, method: 'GET' | 'POST' | 'PATCH' | 'DELETE') {
  if (method !== 'GET' && !isSameOriginRequest(request)) return NextResponse.json({ error: 'Same-origin request required.' }, { status: 403 });
  const { path } = await context.params;
  if (path.length !== 1 || !allowedPaths.has(path[0])) return NextResponse.json({ error: 'Route not found.' }, { status: 404 });
  const action = path[0];
  const token = request.cookies.get(cookieName)?.value;
  if (action === 'session' && method === 'GET' && !token) return NextResponse.json({ customer: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  if (action === 'profile' && !token) return NextResponse.json({ error: 'Customer sign-in required.' }, { status: 401 });
  let payload: unknown = {};
  if (method === 'POST' || method === 'PATCH') {
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  }
  try {
    const upstream = await fetch(new URL(`/api/customers/${action}`, getFormaApiOrigin()), {
      method, cache: 'no-store',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(method === 'POST' || method === 'PATCH' ? { 'Content-Type': 'application/json' } : {}) },
      ...(method === 'POST' || method === 'PATCH' ? { body: JSON.stringify(payload) } : {}),
    });
    const data: unknown = await upstream.json().catch(() => ({ error: 'Account service returned an invalid response.' }));
    if (upstream.ok && ['login', 'verify-email', 'google', 'facebook'].includes(action) && data && typeof data === 'object' && 'token' in data) {
      const { token: sessionToken, ...publicData } = data as { token: string; [key: string]: unknown };
      const response = NextResponse.json(publicData, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
      response.cookies.set(cookieName, sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/customer', maxAge: 30 * 24 * 60 * 60 });
      return response;
    }
    const response = NextResponse.json(data, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    if (action === 'session' && method === 'DELETE') response.cookies.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/customer', maxAge: 0 });
    return response;
  } catch { return NextResponse.json({ error: 'Account service is temporarily unavailable.' }, { status: 503 }); }
}

export const GET = (request: NextRequest, context: RouteContext) => proxy(request, context, 'GET');
export const POST = (request: NextRequest, context: RouteContext) => proxy(request, context, 'POST');
export const PATCH = (request: NextRequest, context: RouteContext) => proxy(request, context, 'PATCH');
export const DELETE = (request: NextRequest, context: RouteContext) => proxy(request, context, 'DELETE');
