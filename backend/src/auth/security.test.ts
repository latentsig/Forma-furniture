import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasPermission } from './rbac.ts';
import { decryptTotpSecret, encryptTotpSecret, hashPassword, passwordMatches, verifyTotp } from './service.ts';

test('TOTP verification follows the RFC 6238 SHA-1 vector and accepts the adjacent clock step', () => {
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(verifyTotp(rfcSecret, '287082', 59_000), true);
  assert.equal(verifyTotp(rfcSecret, '123456', 59_000), false);
  assert.equal(verifyTotp('bad', '287082', 59_000), false);
});

test('admin roles use explicit least-privilege grants', () => {
  assert.equal(hasPermission('OWNER', 'staff:manage'), true);
  assert.equal(hasPermission('CATALOG_MANAGER', 'catalog:write'), true);
  assert.equal(hasPermission('CATALOG_MANAGER', 'catalog:publish'), false);
  assert.equal(hasPermission('SUPPORT', 'catalog:write'), false);
  assert.equal(hasPermission('ANALYST', 'audit:read'), true);
  assert.equal(hasPermission('ANALYST', 'staff:manage'), false);
  assert.equal(hasPermission('ORDER_MANAGER', 'reports:read'), false);
  assert.equal(hasPermission('OWNER', 'orders:manage'), true);
  assert.equal(hasPermission('ORDER_MANAGER', 'orders:read'), true);
  assert.equal(hasPermission('ORDER_MANAGER', 'orders:manage'), true);
  assert.equal(hasPermission('SUPPORT', 'orders:read'), true);
  assert.equal(hasPermission('SUPPORT', 'orders:manage'), false);
  assert.equal(hasPermission('CATALOG_MANAGER', 'orders:read'), false);
});

test('password digests are salted, verified with timing-safe comparison, and MFA secrets are authenticated encrypted data', async () => {
  const password = await hashPassword('A-strong-test-password-4729');
  assert.equal(await passwordMatches('A-strong-test-password-4729', password.salt, password.hash), true);
  assert.equal(await passwordMatches('wrong-password', password.salt, password.hash), false);
  assert.notEqual(password.salt, '');
  const encrypted = encryptTotpSecret('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  assert.notEqual(encrypted, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  assert.equal(decryptTotpSecret(encrypted), 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  assert.throws(() => decryptTotpSecret(`${encrypted.slice(0, -2)}aa`));
});
