export type FacebookIdentity = { id: string; email: string; name: string };

type FacebookTokenResponse = { access_token?: unknown; token_type?: unknown };
type FacebookProfileResponse = { id?: unknown; email?: unknown; name?: unknown };

function graphVersion() {
  const version = process.env.FACEBOOK_GRAPH_VERSION ?? '';
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Facebook Graph API version is not configured.');
  return version;
}

/** Exchange a one-use Facebook OAuth code on the server; never return its token. */
export async function exchangeFacebookCode(code: string, redirectUri: string): Promise<FacebookIdentity | null> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const configuredRedirect = process.env.FACEBOOK_REDIRECT_URI;
  if (!appId || !appSecret || !configuredRedirect || !code || code.length > 4096 || redirectUri !== configuredRedirect) return null;
  let tokenUrl: URL;
  try { tokenUrl = new URL(`https://graph.facebook.com/${graphVersion()}/oauth/access_token`); }
  catch { return null; }
  tokenUrl.search = new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: configuredRedirect, code }).toString();
  const tokenResponse = await fetch(tokenUrl, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  const tokenData = await tokenResponse.json().catch(() => null) as FacebookTokenResponse | null;
  if (!tokenResponse.ok || typeof tokenData?.access_token !== 'string' || tokenData.access_token.length > 8192) return null;

  const profileUrl = new URL(`https://graph.facebook.com/${graphVersion()}/me`);
  profileUrl.search = new URLSearchParams({ fields: 'id,name,email', access_token: tokenData.access_token }).toString();
  const profileResponse = await fetch(profileUrl, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  const profile = await profileResponse.json().catch(() => null) as FacebookProfileResponse | null;
  if (!profileResponse.ok || typeof profile?.id !== 'string' || !/^\d{1,80}$/.test(profile.id) || typeof profile.email !== 'string' || typeof profile.name !== 'string') return null;
  const email = profile.email.trim().toLowerCase();
  const name = profile.name.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || name.length > 160) return null;
  return { id: profile.id, email, name };
}
