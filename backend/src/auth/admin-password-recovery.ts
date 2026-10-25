import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { adminAuditLogs, adminPasswordResetTokens, adminSessions, adminUsers } from '../db/schema.ts';
import { decryptTotpSecret, encryptTotpSecret, generateTotpSecret, hashPassword, tokenDigest, validatePassword, verifyTotp } from './service.ts';

const tokenLifetimeMs = 30 * 60 * 1000;

export async function issueAdminPasswordReset(adminId: string, now = new Date()) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + tokenLifetimeMs);
  await db.transaction(async (tx) => {
    await tx.delete(adminPasswordResetTokens).where(and(eq(adminPasswordResetTokens.adminId, adminId), isNull(adminPasswordResetTokens.usedAt)));
    await tx.insert(adminPasswordResetTokens).values({ tokenHash: tokenDigest(token), adminId, expiresAt });
  });
  return { token, expiresAt };
}

export async function resetAdminPassword(token: string, password: string, now = new Date()) {
  if (!validatePassword(password) || token.length > 128) return false;
  const passwordData = await hashPassword(password);
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(adminPasswordResetTokens)
      .where(and(eq(adminPasswordResetTokens.tokenHash, tokenDigest(token)), isNull(adminPasswordResetTokens.usedAt), gt(adminPasswordResetTokens.expiresAt, now)))
      .limit(1).for('update');
    if (!row) return false;
    const [user] = await tx.select().from(adminUsers).where(eq(adminUsers.id, row.adminId)).limit(1).for('update');
    if (!user?.isActive) return false;
    await tx.update(adminPasswordResetTokens).set({ usedAt: now }).where(eq(adminPasswordResetTokens.tokenHash, row.tokenHash));
    await tx.update(adminUsers).set({ passwordSalt: passwordData.salt, passwordHash: passwordData.hash, failedLoginCount: 0, lockedUntil: null, updatedAt: now }).where(eq(adminUsers.id, user.id));
    await tx.delete(adminSessions).where(eq(adminSessions.userId, user.id));
    await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: user.id, action: 'admin.password_reset', targetId: user.id, metadata: { method: 'verified_email_token' }, createdAt: now });
    return true;
  });
}

export async function prepareAdminAccessRecovery(token: string, now = new Date()) {
  if (!token || token.length > 128) return null;
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(adminPasswordResetTokens)
      .where(and(eq(adminPasswordResetTokens.tokenHash, tokenDigest(token)), isNull(adminPasswordResetTokens.usedAt), gt(adminPasswordResetTokens.expiresAt, now)))
      .limit(1).for('update');
    if (!row) return null;
    const [user] = await tx.select().from(adminUsers).where(and(eq(adminUsers.id, row.adminId), eq(adminUsers.isActive, true))).limit(1);
    if (!user) return null;
    let encryptedSecret = row.recoveryTotpSecretEncrypted;
    if (!encryptedSecret) {
      encryptedSecret = encryptTotpSecret(generateTotpSecret());
      await tx.update(adminPasswordResetTokens).set({ recoveryTotpSecretEncrypted: encryptedSecret }).where(eq(adminPasswordResetTokens.tokenHash, row.tokenHash));
    }
    const secret = decryptTotpSecret(encryptedSecret);
    const label = encodeURIComponent(`Forma Furniture:${user.email}`);
    const params = new URLSearchParams({ secret, issuer: 'Forma Furniture', algorithm: 'SHA1', digits: '6', period: '30' });
    return { email: user.email, secret, otpauthUri: `otpauth://totp/${label}?${params.toString()}` };
  });
}

export async function completeAdminAccessRecovery(token: string, password: string, totp: string, now = new Date()) {
  if (!validatePassword(password) || !/^\d{6}$/.test(totp) || token.length > 128) return false;
  const passwordData = await hashPassword(password);
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(adminPasswordResetTokens)
      .where(and(eq(adminPasswordResetTokens.tokenHash, tokenDigest(token)), isNull(adminPasswordResetTokens.usedAt), gt(adminPasswordResetTokens.expiresAt, now)))
      .limit(1).for('update');
    if (!row?.recoveryTotpSecretEncrypted) return false;
    const [user] = await tx.select().from(adminUsers).where(and(eq(adminUsers.id, row.adminId), eq(adminUsers.isActive, true))).limit(1).for('update');
    if (!user || !verifyTotp(decryptTotpSecret(row.recoveryTotpSecretEncrypted), totp, now.getTime())) return false;
    await tx.update(adminPasswordResetTokens).set({ usedAt: now }).where(eq(adminPasswordResetTokens.tokenHash, row.tokenHash));
    await tx.update(adminUsers).set({
      passwordSalt: passwordData.salt,
      passwordHash: passwordData.hash,
      totpSecretEncrypted: row.recoveryTotpSecretEncrypted,
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: now,
    }).where(eq(adminUsers.id, user.id));
    await tx.delete(adminSessions).where(eq(adminSessions.userId, user.id));
    await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: user.id, action: 'admin.access_recovered', targetId: user.id, metadata: { method: 'verified_email_and_new_totp' }, createdAt: now });
    return true;
  });
}
