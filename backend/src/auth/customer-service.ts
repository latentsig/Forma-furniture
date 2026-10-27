import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { customerAuthTokens, customerOAuthNonces, customerSessions, customers } from '../db/schema.ts';
import { hashPassword, normalizeEmail, passwordMatches, tokenDigest } from './service.ts';

const customerSessionMs = 30 * 24 * 60 * 60 * 1000;
const emailTokenMs = 60 * 60 * 1000;
const resetTokenMs = 30 * 60 * 1000;
export type CustomerPublic = { id: string; email: string; fullName: string; phone: string | null; emailVerified: boolean };
type CustomerRecord = typeof customers.$inferSelect;

export function validateCustomerPassword(value: string) {
  return value.length >= 12 && value.length <= 256 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

export function safeCustomer(user: CustomerRecord): CustomerPublic {
  return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, emailVerified: Boolean(user.emailVerifiedAt) };
}

export async function createCustomer(input: { email: string; fullName: string; phone?: string; password?: string; googleSubject?: string; facebookSubject?: string }) {
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  const phone = input.phone?.trim() || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || fullName.length < 2 || fullName.length > 160 || (phone && (phone.length > 32 || !/^\+?[0-9 ()-]{7,32}$/.test(phone)))) throw new Error('Invalid customer profile.');
  const passwordData = input.password ? await hashPassword(input.password) : null;
  const [created] = await db.insert(customers).values({
    id: randomUUID(), email, fullName, phone,
    passwordSalt: passwordData?.salt ?? null, passwordHash: passwordData?.hash ?? null,
    googleSubject: input.googleSubject ?? null,
    facebookSubject: input.facebookSubject ?? null,
  }).returning();
  return created;
}

export async function issueCustomerToken(customerId: string, purpose: 'email_verification' | 'password_reset', now = new Date()) {
  const token = randomBytes(32).toString('base64url');
  const duration = purpose === 'email_verification' ? emailTokenMs : resetTokenMs;
  await db.transaction(async (tx) => {
    await tx.delete(customerAuthTokens).where(and(eq(customerAuthTokens.customerId, customerId), eq(customerAuthTokens.purpose, purpose), isNull(customerAuthTokens.usedAt)));
    await tx.insert(customerAuthTokens).values({ tokenHash: tokenDigest(token), customerId, purpose, expiresAt: new Date(now.getTime() + duration) });
  });
  return { token, expiresAt: new Date(now.getTime() + duration) };
}

export async function verifyCustomerEmail(token: string, now = new Date()) {
  return db.transaction(async (tx) => {
    if (token.length > 128) return null;
    const [row] = await tx.select({ token: customerAuthTokens, customer: customers }).from(customerAuthTokens)
      .innerJoin(customers, eq(customerAuthTokens.customerId, customers.id))
      .where(and(eq(customerAuthTokens.tokenHash, tokenDigest(token)), eq(customerAuthTokens.purpose, 'email_verification'), isNull(customerAuthTokens.usedAt), gt(customerAuthTokens.expiresAt, now))).limit(1).for('update');
    if (!row) return null;
    await tx.update(customerAuthTokens).set({ usedAt: now }).where(eq(customerAuthTokens.tokenHash, row.token.tokenHash));
    const [verified] = await tx.update(customers).set({ emailVerifiedAt: now, updatedAt: now }).where(eq(customers.id, row.customer.id)).returning();
    return verified;
  });
}

export async function loginCustomer(emailInput: string, password: string, now = new Date()) {
  const [user] = await db.select().from(customers).where(eq(customers.email, normalizeEmail(emailInput))).limit(1);
  if (!user) {
    await passwordMatches(password, '00000000000000000000000000000000', '0'.repeat(128));
    return null;
  }
  if (!user.passwordSalt || !user.passwordHash || !user.emailVerifiedAt || !await passwordMatches(password, user.passwordSalt, user.passwordHash)) return null;
  return createCustomerSession(user, now);
}

export async function createCustomerSession(user: CustomerRecord, now = new Date()) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + customerSessionMs);
  await db.insert(customerSessions).values({ tokenHash: tokenDigest(token), customerId: user.id, expiresAt });
  return { token, customer: safeCustomer(user), expiresAt };
}

export async function getCustomerSession(token: string | undefined, now = new Date()) {
  if (!token || token.length > 128) return null;
  const [row] = await db.select({ customer: customers }).from(customerSessions)
    .innerJoin(customers, eq(customerSessions.customerId, customers.id))
    .where(and(eq(customerSessions.tokenHash, tokenDigest(token)), gt(customerSessions.expiresAt, now))).limit(1);
  return row ? safeCustomer(row.customer) : null;
}

export async function revokeCustomerSession(token: string | undefined) {
  if (!token || token.length > 128) return;
  await db.delete(customerSessions).where(eq(customerSessions.tokenHash, tokenDigest(token)));
}

export async function registerGoogleNonce(nonce: string, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(nonce)) throw new Error('Invalid OIDC nonce.');
  await db.delete(customerOAuthNonces).where(lt(customerOAuthNonces.expiresAt, now));
  await db.insert(customerOAuthNonces).values({ nonceHash: tokenDigest(nonce), expiresAt: new Date(now.getTime() + 10 * 60_000) });
}

export async function consumeGoogleNonce(nonce: string, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(nonce)) return false;
  const [row] = await db.update(customerOAuthNonces).set({ consumedAt: now })
    .where(and(eq(customerOAuthNonces.nonceHash, tokenDigest(nonce)), isNull(customerOAuthNonces.consumedAt), gt(customerOAuthNonces.expiresAt, now)))
    .returning({ nonceHash: customerOAuthNonces.nonceHash });
  return Boolean(row);
}

export async function resetCustomerPassword(token: string, password: string, now = new Date()) {
  if (!validateCustomerPassword(password) || token.length > 128) return false;
  const passwordData = await hashPassword(password);
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(customerAuthTokens).where(and(eq(customerAuthTokens.tokenHash, tokenDigest(token)), eq(customerAuthTokens.purpose, 'password_reset'), isNull(customerAuthTokens.usedAt), gt(customerAuthTokens.expiresAt, now))).limit(1).for('update');
    if (!row) return false;
    await tx.update(customerAuthTokens).set({ usedAt: now }).where(eq(customerAuthTokens.tokenHash, row.tokenHash));
    await tx.update(customers).set({ passwordSalt: passwordData.salt, passwordHash: passwordData.hash, updatedAt: now }).where(eq(customers.id, row.customerId));
    await tx.delete(customerSessions).where(eq(customerSessions.customerId, row.customerId));
    return true;
  });
}

export async function findCustomerByGoogle(subject: string, emailInput: string, fullName: string) {
  const email = normalizeEmail(emailInput);
  const [bySubject] = await db.select().from(customers).where(eq(customers.googleSubject, subject)).limit(1);
  if (bySubject) return bySubject;
  const [byEmail] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  if (byEmail) {
    if (!byEmail.emailVerifiedAt) throw new Error('An unverified account already uses this email. Verify it before connecting Google.');
    const [linked] = await db.update(customers).set({ googleSubject: subject, updatedAt: new Date() }).where(eq(customers.id, byEmail.id)).returning();
    return linked;
  }
  return createCustomer({ email, fullName, googleSubject: subject }).then(async (created) => {
    const [verified] = await db.update(customers).set({ emailVerifiedAt: new Date() }).where(eq(customers.id, created.id)).returning();
    return verified;
  });
}

/** Facebook does not provide a verified-email claim in /me. Keep that identity
 * separate and require the normal email verification flow before commerce actions. */
export async function findCustomerByFacebook(subject: string, emailInput: string, fullName: string) {
  const email = normalizeEmail(emailInput);
  const [bySubject] = await db.select().from(customers).where(eq(customers.facebookSubject, subject)).limit(1);
  if (bySubject) return bySubject;
  const [byEmail] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  if (byEmail) return null;
  try {
    return await createCustomer({ email, fullName, facebookSubject: subject });
  } catch (error) {
    // A concurrent signup can claim the unique email after the lookup above.
    const [racedEmail] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
    if (racedEmail) return null;
    throw error;
  }
}
