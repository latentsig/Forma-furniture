import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const apiOrigin = process.env.FORMA_API_URL ?? 'http://127.0.0.1:4100';
const cookieName = 'forma_customer_session';
const oauthCookieNames = ['forma_google_state', 'forma_google_nonce', 'forma_google_verifier'];
const clearCookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/customer/google', maxAge: 0 };

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const account = new URL('/account', request.nextUrl.origin);
  const state = request.nextUrl.searchParams.get('state') ?? '';
  const code = request.nextUrl.searchParams.get('code');
  const expectedState = request.cookies.get('forma_google_state')?.value ?? '';
  const nonce = request.cookies.get('forma_google_nonce')?.value ?? '';
  const verifier = request.cookies.get('forma_google_verifier')?.value ?? '';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const response = NextResponse.redirect(account);
  for (const name of oauthCookieNames) response.cookies.set(name, '', clearCookie);
  if (!code || !expectedState || !constantTimeEqual(state, expectedState) || !nonce || !verifier || !clientId || !clientSecret) {
    account.searchParams.set('error', 'google-sign-in-failed'); response.headers.set('Location', account.toString()); return response;
  }
  try {
    const redirectUri = new URL('/api/customer/google/callback', request.nextUrl.origin).toString();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, cache: 'no-store',
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code', code_verifier: verifier }),
    });
    const tokenData: unknown = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData || typeof tokenData !== 'object' || !('id_token' in tokenData) || typeof tokenData.id_token !== 'string') throw new Error('Google token exchange failed.');
    const accountResponse = await fetch(new URL('/api/customers/google', apiOrigin), {
      method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: tokenData.id_token, nonce }),
    });
    const accountData: unknown = await accountResponse.json();
    if (!accountResponse.ok || !accountData || typeof accountData !== 'object' || !('token' in accountData) || typeof accountData.token !== 'string') throw new Error('Account session could not be created.');
    const { token, customer } = accountData as { token: string; customer: unknown };
    const success = NextResponse.redirect(new URL('/account?welcome=google', request.nextUrl.origin));
    for (const name of oauthCookieNames) success.cookies.set(name, '', clearCookie);
    success.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/customer', maxAge: 30 * 24 * 60 * 60 });
    success.headers.set('Cache-Control', 'no-store');
    void customer;
    return success;
  } catch {
    const failed = NextResponse.redirect(new URL('/account?error=google-sign-in-failed', request.nextUrl.origin));
    for (const name of oauthCookieNames) failed.cookies.set(name, '', clearCookie);
    return failed;
  }
}
