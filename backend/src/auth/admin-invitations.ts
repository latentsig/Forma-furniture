import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { adminAuditLogs, adminInvitations, adminSessions, adminUsers, type AdminRole } from '../db/schema.ts';
import { decryptTotpSecret, encryptTotpSecret, generateTotpSecret, hashPassword, normalizeEmail, safeAdmin, sessionExpiryMs, tokenDigest, validatePassword, verifyTotp } from './service.ts';

const inviteLifetimeMs = 24 * 60 * 60 * 1000;
const enrollmentLifetimeMs = 10 * 60 * 1000;
const validRoles: AdminRole[] = ['OWNER', 'CATALOG_MANAGER', 'ORDER_MANAGER', 'SUPPORT', 'ANALYST'];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && validRoles.includes(value as AdminRole);
}

export async function createAdminInvitation(actorId: string, emailInput: string, role: AdminRole) {
  const email = normalizeEmail(emailInput);
  const now = new Date();
  const token = randomBytes(32).toString('base64url');
  const id = randomUUID();
  const expiresAt = new Date(now.getTime() + inviteLifetimeMs);
  await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (existing) throw new Error('A staff account already exists for this email.');
    await tx.update(adminInvitations).set({ usedAt: now }).where(and(eq(adminInvitations.email, email), isNull(adminInvitations.usedAt)));
    await tx.insert(adminInvitations).values({ id, email, role, tokenHash: tokenDigest(token), expiresAt, createdBy: actorId });
    await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId, action: 'staff.invited', targetId: email, metadata: { role, expiresAt: expiresAt.toISOString() } });
  });
  return { id, email, role, token, expiresAt };
}

export async function cancelAdminInvitation(actorId: string, invitationId: string) {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [invitation] = await tx.update(adminInvitations).set({ usedAt: now, enrollmentTokenHash: null, enrollmentExpiresAt: null, passwordSalt: null, passwordHash: null, totpSecretEncrypted: null })
      .where(and(eq(adminInvitations.id, invitationId), isNull(adminInvitations.usedAt))).returning();
    if (!invitation) return false;
    await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId, action: 'staff.invitation_cancelled', targetId: invitation.email, metadata: { role: invitation.role } });
    return true;
  });
}

export async function listAdminInvitations() {
  const now = new Date();
  const rows = await db.select({ id: adminInvitations.id, email: adminInvitations.email, role: adminInvitations.role, expiresAt: adminInvitations.expiresAt, createdAt: adminInvitations.createdAt })
    .from(adminInvitations).where(and(isNull(adminInvitations.usedAt), gt(adminInvitations.expiresAt, now))).orderBy(adminInvitations.createdAt).limit(200);
  return rows;
}

export async function inspectAdminInvitation(token: string) {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const now = new Date();
  const [invite] = await db.select({ email: adminInvitations.email, role: adminInvitations.role, expiresAt: adminInvitations.expiresAt })
    .from(adminInvitations).where(and(eq(adminInvitations.tokenHash, tokenDigest(token)), isNull(adminInvitations.usedAt), gt(adminInvitations.expiresAt, now))).limit(1);
  return invite ?? null;
}

export async function prepareAdminInvitation(token: string, password: string) {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) throw new Error('This invitation is invalid or expired.');
  if (!validatePassword(password)) throw new Error('Use a 15+ character password with lowercase, uppercase and a number.');
  const now = new Date();
  const [invite] = await db.select().from(adminInvitations).where(and(eq(adminInvitations.tokenHash, tokenDigest(token)), isNull(adminInvitations.usedAt), gt(adminInvitations.expiresAt, now))).limit(1);
  if (!invite) throw new Error('This invitation is invalid or expired.');
  const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, invite.email)).limit(1);
  if (existing) throw new Error('A staff account already exists for this email.');

  const passwordData = await hashPassword(password);
  const totpSecret = generateTotpSecret();
  const setupToken = randomBytes(32).toString('base64url');
  const enrollmentExpiresAt = new Date(Date.now() + enrollmentLifetimeMs);
  const [updated] = await db.update(adminInvitations).set({
    passwordSalt: passwordData.salt,
    passwordHash: passwordData.hash,
    totpSecretEncrypted: encryptTotpSecret(totpSecret),
    enrollmentTokenHash: tokenDigest(setupToken),
    enrollmentExpiresAt,
    failedTotpAttempts: 0,
  }).where(and(eq(adminInvitations.id, invite.id), isNull(adminInvitations.usedAt), gt(adminInvitations.expiresAt, now))).returning({ id: adminInvitations.id });
  if (!updated) throw new Error('This invitation is invalid or expired.');
  const issuer = 'Forma Furniture';
  const uri = `otpauth://totp/${encodeURIComponent(`${issuer}:${invite.email}`)}?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return { setupToken, totpSecret, otpauthUri: uri, email: invite.email, role: invite.role, expiresInSeconds: enrollmentLifetimeMs / 1000 };
}

export async function completeAdminInvitation(setupToken: string, totp: string) {
  if (setupToken.length > 128 || !/^\d{6}$/.test(totp)) throw new Error('Enter the current six-digit authenticator code.');
  const now = new Date();
  const setupHash = tokenDigest(setupToken);
  const [invite] = await db.select().from(adminInvitations).where(and(eq(adminInvitations.enrollmentTokenHash, setupHash), isNull(adminInvitations.usedAt))).limit(1);
  if (!invite || !invite.enrollmentExpiresAt || invite.enrollmentExpiresAt <= now || !invite.passwordSalt || !invite.passwordHash || !invite.totpSecretEncrypted) {
    if (invite) await db.update(adminInvitations).set({ enrollmentTokenHash: null, enrollmentExpiresAt: null, passwordSalt: null, passwordHash: null, totpSecretEncrypted: null, failedTotpAttempts: 0 }).where(eq(adminInvitations.id, invite.id));
    throw new Error('Enrollment expired. Reopen your invitation and start setup again.');
  }

  let secret: string;
  try { secret = decryptTotpSecret(invite.totpSecretEncrypted); }
  catch { throw new Error('Authenticator setup is temporarily unavailable. Ask the owner to issue a fresh invitation.'); }
  if (!verifyTotp(secret, totp, now.getTime())) {
    const attempts = invite.failedTotpAttempts + 1;
    await db.update(adminInvitations).set({
      failedTotpAttempts: attempts,
      ...(attempts >= 5 ? { enrollmentTokenHash: null, enrollmentExpiresAt: null, passwordSalt: null, passwordHash: null, totpSecretEncrypted: null, failedTotpAttempts: 0 } : {}),
    }).where(and(eq(adminInvitations.id, invite.id), eq(adminInvitations.enrollmentTokenHash, setupHash), isNull(adminInvitations.usedAt)));
    throw new Error(attempts >= 5 ? 'Enrollment was closed after repeated invalid codes. Reopen your invitation and start again.' : 'Authenticator code does not match. Check your device clock and try the current six-digit code.');
  }

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + sessionExpiryMs());
  const created = await db.transaction(async (tx) => {
    const [claimed] = await tx.update(adminInvitations).set({ usedAt: now, enrollmentTokenHash: null, enrollmentExpiresAt: null, passwordSalt: null, passwordHash: null, totpSecretEncrypted: null })
      .where(and(eq(adminInvitations.id, invite.id), eq(adminInvitations.enrollmentTokenHash, setupHash), isNull(adminInvitations.usedAt), gt(adminInvitations.enrollmentExpiresAt, now))).returning();
    if (!claimed) throw new Error('This invitation has already been used or expired.');
    const [user] = await tx.insert(adminUsers).values({
      id: randomUUID(), email: invite.email, role: invite.role,
      passwordSalt: invite.passwordSalt!, passwordHash: invite.passwordHash!,
      totpSecretEncrypted: invite.totpSecretEncrypted!,
    }).onConflictDoNothing({ target: adminUsers.email }).returning();
    if (!user) throw new Error('A staff account already exists for this email.');
    await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: invite.createdBy, action: 'staff.invitation_accepted', targetId: user.id, metadata: { role: user.role } });
    await tx.insert(adminSessions).values({ tokenHash: tokenDigest(token), userId: user.id, expiresAt });
    return user;
  });
  return { token, user: safeAdmin(created), expiresAt: expiresAt.toISOString() };
}
