import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '../../same-origin';
import { getFormaApiOrigin } from '@/server/api-origin';

const cookieName = 'forma_admin_session';
type RouteContext = { params: Promise<{ path: string[] }> };

function backendPath(parts: string[]) {
  const safe = parts.length > 0 && parts.every((part) => /^[a-zA-Z0-9_-]{1,160}$/.test(part));
  if (!safe) return null;
  const joined = parts.join('/');
  if (['session', 'products', 'staff', 'audit'].includes(joined) ||
      ['orders'].includes(joined) ||
      ['bootstrap/status', 'bootstrap/begin', 'bootstrap/complete'].includes(joined) ||
      ['password-reset/request', 'password-reset/complete', 'access-recovery/request', 'access-recovery/prepare', 'access-recovery/complete'].includes(joined) ||
      ['invitations', 'invitations/complete'].includes(joined) ||
      /^invitations\/[A-Za-z0-9_-]{40,64}$/.test(joined) ||
      /^invitations\/[A-Za-z0-9_-]{40,64}\/prepare$/.test(joined) ||
      /^invitations\/[a-f0-9-]{36}$/i.test(joined) ||
      /^products\/[a-z0-9-]+(?:\/approve)?$/.test(joined) ||
      /^products\/import\/(?:preview|commit)$/.test(joined) ||
      /^orders\/[a-f0-9-]{36}$/i.test(joined) ||
      /^inventory\/[a-zA-Z0-9_-]{1,120}$/.test(joined) ||
      /^staff\/[a-f0-9-]{36}$/i.test(joined)) return `/api/admin/${joined}`;
  return null;
}

async function proxy(request: NextRequest, context: RouteContext, method: 'GET' | 'POST' | 'PATCH' | 'DELETE') {
  if (method !== 'GET' && !isSameOriginRequest(request)) return NextResponse.json({ error: 'Same-origin request required.' }, { status: 403 });
  const { path } = await context.params;
  const targetPath = backendPath(path);
  if (!targetPath) return NextResponse.json({ error: 'Route not found.' }, { status: 404 });
  const token = request.cookies.get(cookieName)?.value;
  if (targetPath === '/api/admin/session' && method === 'GET' && !token) return NextResponse.json({ user: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  const publicInvitationRoute = /^\/api\/admin\/invitations\/(?:complete|[A-Za-z0-9_-]{40,64}(?:\/prepare)?)$/.test(targetPath);
  const publicRecoveryRoute = [
    '/api/admin/password-reset/request', '/api/admin/password-reset/complete',
    '/api/admin/access-recovery/request', '/api/admin/access-recovery/prepare', '/api/admin/access-recovery/complete',
  ].includes(targetPath);
  const bootstrapWithoutSession = ['/api/admin/bootstrap/status', '/api/admin/bootstrap/begin', '/api/admin/bootstrap/complete'].includes(targetPath);
  if (!bootstrapWithoutSession && !publicInvitationRoute && !publicRecoveryRoute && (method !== 'POST' || targetPath !== '/api/admin/session')) {
    if (!token) return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
  }
  let payload: unknown = {};
  if (method === 'POST' || method === 'PATCH') {
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  }
  try {
    const upstream = await fetch(new URL(targetPath, getFormaApiOrigin()), {
      method,
      cache: 'no-store',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(method === 'POST' || method === 'PATCH' ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(method === 'POST' || method === 'PATCH' ? { body: JSON.stringify(payload) } : {}),
    });
    const data = await upstream.json().catch(() => ({ error: 'Admin service returned an invalid response.' }));
    if (['/api/admin/session', '/api/admin/bootstrap/complete', '/api/admin/invitations/complete'].includes(targetPath) && method === 'POST' && upstream.ok && data && typeof data === 'object' && 'token' in data) {
      const { token: sessionToken, ...publicData } = data as { token: string; [key: string]: unknown };
      const response = NextResponse.json(publicData, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
      response.cookies.set(cookieName, sessionToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
        path: '/api/admin', maxAge: 8 * 60 * 60,
      });
      return response;
    }
    const response = NextResponse.json(data, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    if (targetPath === '/api/admin/session' && method === 'DELETE') response.cookies.set(cookieName, '', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Admin service is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = (request: NextRequest, context: RouteContext) => proxy(request, context, 'GET');
export const POST = (request: NextRequest, context: RouteContext) => proxy(request, context, 'POST');
export const PATCH = (request: NextRequest, context: RouteContext) => proxy(request, context, 'PATCH');
export const DELETE = (request: NextRequest, context: RouteContext) => proxy(request, context, 'DELETE');
