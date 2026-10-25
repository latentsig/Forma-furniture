import { createPublicKey, createVerify } from 'node:crypto';

type GoogleJwk = { kid: string; kty: string; n: string; e: string; alg?: string; use?: string };
type GoogleClaims = { iss?: string; aud?: string | string[]; exp?: number; sub?: string; nonce?: string; email?: string; email_verified?: boolean; name?: string };
let cachedKeys: GoogleJwk[] = [];
let cacheUntil = 0;

async function signingKeys() {
  if (Date.now() < cacheUntil && cachedKeys.length) return cachedKeys;
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', { cache: 'no-store' });
  if (!response.ok) throw new Error('Google signing keys are unavailable.');
  const body = await response.json() as { keys?: GoogleJwk[] };
  if (!Array.isArray(body.keys)) throw new Error('Google signing keys response is invalid.');
  cachedKeys = body.keys;
  const cacheControl = response.headers.get('cache-control') ?? '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] ?? 300);
  cacheUntil = Date.now() + Math.min(Math.max(maxAge, 60), 3600) * 1000;
  return cachedKeys;
}

export async function verifyGoogleIdToken(token: string, expectedNonce: string, audience = process.env.GOOGLE_CLIENT_ID ?? ''): Promise<Required<Pick<GoogleClaims, 'sub' | 'email' | 'name'>> | null> {
  if (token.length > 12_000 || !expectedNonce || !audience) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as { alg?: string; kid?: string };
    if (header.alg !== 'RS256' || !header.kid) return null;
    const jwk = (await signingKeys()).find((key) => key.kid === header.kid && key.kty === 'RSA' && (!key.alg || key.alg === 'RS256'));
    if (!jwk) return null;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    const signatureValid = verifier.verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));
    if (!signatureValid) return null;
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as GoogleClaims;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss ?? '') || !audiences.includes(audience) || !claims.exp || claims.exp <= nowSeconds || claims.nonce !== expectedNonce || !claims.sub || !claims.email || claims.email_verified !== true) return null;
    return { sub: claims.sub, email: claims.email, name: claims.name?.trim() || claims.email.split('@')[0] };
  } catch { return null; }
}
