import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { adminSessions, adminUsers, type AdminUser } from '../db/schema.ts';

function deriveKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, result) => error ? reject(error) : resolve(result));
  });
}
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const codePeriodSeconds = 30;
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export type SafeAdmin = Pick<AdminUser, 'id' | 'email' | 'role'>;

export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }

export function validatePassword(value: string) {
  return value.length >= 15 && value.length <= 256 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

export function decodeBase32(value: string): Buffer | null {
  const normalized = value.replace(/=+$/, '').toUpperCase();
  if (normalized.length < 32 || normalized.length > 128 || !/^[A-Z2-7]+$/.test(normalized)) return null;
  let bits = '';
  for (const character of normalized) bits += base32Alphabet.indexOf(character).toString(2).padStart(5, '0');
  const output: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) output.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(output);
}

export function generateTotpSecret() {
  const bytes = randomBytes(20);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let secret = '';
  for (let index = 0; index < bits.length; index += 5) secret += base32Alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)];
  return secret;
}

export function verifyTotp(secret: string, candidate: string, now = Date.now()) {
  const key = decodeBase32(secret);
  if (!key || !/^\d{6}$/.test(candidate)) return false;
  const counter = Math.floor(now / 1000 / codePeriodSeconds);
  const supplied = Buffer.from(candidate);
  for (const offset of [-1, 0, 1]) {
    const counterBytes = Buffer.alloc(8);
    counterBytes.writeBigUInt64BE(BigInt(counter + offset));
    const digest = createHmac('sha1', key).update(counterBytes).digest();
    const start = digest[digest.length - 1] & 0x0f;
    const code = (digest.readUInt32BE(start) & 0x7fffffff) % 1_000_000;
    const expected = Buffer.from(String(code).padStart(6, '0'));
    if (timingSafeEqual(supplied, expected)) return true;
  }
  return false;
}

export async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = await deriveKey(password, salt);
  return { salt, hash: hash.toString('hex') };
}

export async function passwordMatches(password: string, salt: string, expectedHex: string) {
  const actual = await deriveKey(password, salt);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export function tokenDigest(token: string) { return createHash('sha256').update(token).digest('hex'); }

function mfaEncryptionKey() {
  const configured = process.env.ADMIN_MFA_ENCRYPTION_KEY ?? '';
  const key = Buffer.from(configured, 'hex');
  if (!/^[a-f0-9]{64}$/i.test(configured) || key.length !== 32) throw new Error('ADMIN_MFA_ENCRYPTION_KEY must be a 32-byte hex key.');
  return key;
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', mfaEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret), cipher.final()]);
  return `v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ciphertext.toString('base64url')}`;
}

export function decryptTotpSecret(value: string) {
  const [version, ivText, tagText, dataText] = value.split(':');
  if (version !== 'v1' || !ivText || !tagText || !dataText) throw new Error('Stored MFA secret has an unsupported format.');
  const decipher = createDecipheriv('aes-256-gcm', mfaEncryptionKey(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
}

export async function authenticateAdmin(emailInput: string, password: string, totp: string, now = new Date()) {
  const email = normalizeEmail(emailInput);
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (!user) {
    await passwordMatches(password, '00000000000000000000000000000000', '0'.repeat(128));
    return null;
  }
  if (!user.isActive || (user.lockedUntil && user.lockedUntil > now)) return null;
  const validPassword = await passwordMatches(password, user.passwordSalt, user.passwordHash);
  if (!validPassword || !verifyTotp(decryptTotpSecret(user.totpSecretEncrypted), totp, now.getTime())) {
    const failures = user.failedLoginCount + 1;
    await db.update(adminUsers).set({
      failedLoginCount: failures >= 5 ? 0 : failures,
      lockedUntil: failures >= 5 ? new Date(now.getTime() + 15 * 60_000) : null,
      updatedAt: now,
    }).where(eq(adminUsers.id, user.id));
    return null;
  }
  await db.update(adminUsers).set({ failedLoginCount: 0, lockedUntil: null, updatedAt: now }).where(eq(adminUsers.id, user.id));
  const token = randomBytes(32).toString('base64url');
  await db.insert(adminSessions).values({ tokenHash: tokenDigest(token), userId: user.id, expiresAt: new Date(now.getTime() + sessionLifetimeMs) });
  return { token, user: safeAdmin(user), expiresAt: new Date(now.getTime() + sessionLifetimeMs) };
}

export async function getAdminSession(token: string | undefined, now = new Date()): Promise<SafeAdmin | null> {
  if (!token || token.length > 128) return null;
  const [row] = await db.select({ session: adminSessions, user: adminUsers }).from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.tokenHash, tokenDigest(token)), gt(adminSessions.expiresAt, now))).limit(1);
  if (!row || !row.user.isActive) return null;
  return safeAdmin(row.user);
}

export async function revokeAdminSession(token: string | undefined) {
  if (!token || token.length > 128) return;
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenDigest(token)));
}

export function safeAdmin(user: AdminUser): SafeAdmin {
  return { id: user.id, email: user.email, role: user.role };
}

export function sessionExpiryMs() { return sessionLifetimeMs; }
