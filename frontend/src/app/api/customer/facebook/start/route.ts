import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const stateCookie = 'forma_facebook_state';
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/customer/facebook', maxAge: 600 };

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const appId = process.env.FACEBOOK_APP_ID;
  const version = process.env.FACEBOOK_GRAPH_VERSION ?? '';
  const callback = process.env.FACEBOOK_REDIRECT_URI ?? '';
  let callbackUrl: URL;
  try { callbackUrl = new URL(callback); } catch { return NextResponse.redirect(new URL('/account?error=facebook-not-configured', origin)); }
  if (!appId || !/^v\d+\.\d+$/.test(version) || callbackUrl.origin !== origin || callbackUrl.pathname !== '/api/customer/facebook/callback' || (process.env.NODE_ENV === 'production' && callbackUrl.protocol !== 'https:')) {
    return NextResponse.redirect(new URL('/account?error=facebook-not-configured', origin));
  }
  const state = randomBytes(32).toString('base64url');
  const authorization = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
  authorization.search = new URLSearchParams({ client_id: appId, redirect_uri: callbackUrl.toString(), response_type: 'code', scope: 'email,public_profile', state }).toString();
  const response = NextResponse.redirect(authorization);
  response.cookies.set(stateCookie, state, cookieOptions);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
