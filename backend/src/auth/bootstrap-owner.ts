import { randomUUID } from 'node:crypto';
import { count } from 'drizzle-orm';
import { db, sql } from '../db/connection.ts';
import { adminUsers } from '../db/schema.ts';
import { decodeBase32, encryptTotpSecret, hashPassword, normalizeEmail, validatePassword } from './service.ts';

try {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const totpSecret = process.env.OWNER_TOTP_SECRET;
  const totpCode = process.env.OWNER_TOTP_CODE;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Set a valid OWNER_EMAIL.');
  if (!password || !validatePassword(password)) throw new Error('OWNER_PASSWORD must be 15–256 characters and include lowercase, uppercase and a digit.');
  if (!totpSecret || !decodeBase32(totpSecret)) throw new Error('Set OWNER_TOTP_SECRET to a base32 secret of at least 32 characters.');
  if (!totpCode || !/^\d{6}$/.test(totpCode)) throw new Error('Set OWNER_TOTP_CODE to the current six-digit code from the configured authenticator.');
  const { verifyTotp } = await import('./service.ts');
  if (!verifyTotp(totpSecret, totpCode)) throw new Error('OWNER_TOTP_CODE does not match OWNER_TOTP_SECRET.');
  const [{ value: existingCount }] = await db.select({ value: count() }).from(adminUsers);
  if (existingCount !== 0) throw new Error('Bootstrap refused: admin users already exist. Use the owner staff-management workflow.');
  const passwordData = await hashPassword(password);
  await db.insert(adminUsers).values({
    id: randomUUID(), email: normalizeEmail(email), passwordSalt: passwordData.salt,
    passwordHash: passwordData.hash, totpSecretEncrypted: encryptTotpSecret(totpSecret.replace(/=+$/, '').toUpperCase()), role: 'OWNER',
  });
  process.stdout.write('Initial OWNER account created. No password or MFA secret was emitted.\n');
} finally {
  await sql.end();
}
