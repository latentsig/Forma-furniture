import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getFormaApiOrigin } from '@/server/api-origin';

export const dynamic = 'force-dynamic';
const cookieName = 'forma_customer_session';
const stateCookie = 'forma_facebook_state';
const cookiePath = '/api/customer/facebook';
const clearCookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: cookiePath, maxAge: 0 };

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

function redirectWithError(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/account?error=${error}`, request.nextUrl.origin));
  response.cookies.set(stateCookie, '', clearCookie);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state') ?? '';
  const expectedState = request.cookies.get(stateCookie)?.value ?? '';
  const code = request.nextUrl.searchParams.get('code') ?? '';
  const providerError = request.nextUrl.searchParams.get('error');
  if (providerError) return redirectWithError(request, 'facebook-sign-in-failed');
  if (!code || code.length > 4096 || !constantTimeEqual(state, expectedState)) return redirectWithError(request, 'facebook-sign-in-failed');
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI ?? '';
  let configuredCallback: URL;
  try { configuredCallback = new URL(redirectUri); } catch { return redirectWithError(request, 'facebook-not-configured'); }
  if (configuredCallback.origin !== request.nextUrl.origin || configuredCallback.pathname !== '/api/customer/facebook/callback') return redirectWithError(request, 'facebook-not-configured');
  try {
    const upstream = await fetch(new URL('/api/customers/facebook', getFormaApiOrigin()), {
      method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }), signal: AbortSignal.timeout(12_000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok || !data || typeof data !== 'object' || !('token' in data) || typeof data.token !== 'string') {
      return redirectWithError(request, upstream.status === 409 ? 'facebook-email-conflict' : 'facebook-sign-in-failed');
    }
    const success = NextResponse.redirect(new URL('/account?welcome=facebook', request.nextUrl.origin));
    success.cookies.set(stateCookie, '', clearCookie);
    success.cookies.set(cookieName, data.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/customer', maxAge: 30 * 24 * 60 * 60 });
    success.headers.set('Cache-Control', 'no-store');
    return success;
  } catch { return redirectWithError(request, 'facebook-sign-in-failed'); }
}
