import { createHmac } from 'node:crypto';
import { lt, sql } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { authRateLimitBuckets } from '../db/schema.ts';

const windowMs = 60_000;
const bucketRetentionMs = 10 * 60_000;
let cleanupCounter = 0;

function bucketDigest(clientIp: string, route: string, windowStartMs: number) {
  const configured = process.env.ADMIN_MFA_ENCRYPTION_KEY ?? '';
  if (!/^[a-f0-9]{64}$/i.test(configured)) throw new Error('ADMIN_MFA_ENCRYPTION_KEY must be a 32-byte hex key.');
  const rootKey = Buffer.from(configured, 'hex');
  const derivedKey = createHmac('sha256', rootKey).update('forma-rate-limit-key-v1').digest();
  return createHmac('sha256', derivedKey)
    .update(clientIp).update('\0').update(route).update('\0').update(String(windowStartMs))
    .digest('hex');
}

/** Atomically increments a privacy-preserving PostgreSQL throttle bucket shared across API workers. */
export async function consumeRateLimit(clientIp: string, route: string, limit: number, now = new Date()) {
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const bucketKey = bucketDigest(clientIp, route, windowStartMs);
  const [bucket] = await db.insert(authRateLimitBuckets).values({
    bucketKey,
    windowStart,
    attempts: 1,
    expiresAt: new Date(windowStartMs + bucketRetentionMs),
  }).onConflictDoUpdate({
    target: authRateLimitBuckets.bucketKey,
    set: { attempts: sql`${authRateLimitBuckets.attempts} + 1` },
  }).returning({ attempts: authRateLimitBuckets.attempts });
  cleanupCounter += 1;
  if (cleanupCounter >= 512) {
    cleanupCounter = 0;
    await db.delete(authRateLimitBuckets).where(lt(authRateLimitBuckets.expiresAt, now)).catch(() => undefined);
  }
  return bucket.attempts > limit;
}
