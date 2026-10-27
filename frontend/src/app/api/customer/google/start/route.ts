import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getFormaApiOrigin } from '@/server/api-origin';

export const dynamic = 'force-dynamic';
const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/customer/google', maxAge: 600 };

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/account?error=google-not-configured', origin));
  const state = randomBytes(32).toString('base64url');
  const nonce = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const callback = new URL('/api/customer/google/callback', origin).toString();
  try {
    const registered = await fetch(new URL('/api/customers/google/nonce', getFormaApiOrigin()), { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nonce }) });
    if (!registered.ok) return NextResponse.redirect(new URL('/account?error=google-sign-in-unavailable', origin));
  } catch { return NextResponse.redirect(new URL('/account?error=google-sign-in-unavailable', origin)); }
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.search = new URLSearchParams({ client_id: clientId, redirect_uri: callback, response_type: 'code', scope: 'openid email profile', state, nonce, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
  const response = NextResponse.redirect(authorization);
  response.cookies.set('forma_google_state', state, cookieBase);
  response.cookies.set('forma_google_nonce', nonce, cookieBase);
  response.cookies.set('forma_google_verifier', verifier, cookieBase);
  return response;
}
