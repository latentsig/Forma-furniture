import assert from 'node:assert/strict';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { db, sql } from './db/connection.ts';
import { createCommerceServer } from './server.ts';
import { listProducts } from './catalog/product-service.ts';
import { adminAuditLogs, adminInvitations, adminPasswordResetTokens, adminSessions, adminUsers, authRateLimitBuckets, customerAuthTokens, customerOAuthNonces, customerSessions, customers, productInventory, products } from './db/schema.ts';
import { decodeBase32, encryptTotpSecret, hashPassword, passwordMatches, tokenDigest } from './auth/service.ts';
import { consumeRateLimit } from './auth/rate-limit.ts';
import { consumeGoogleNonce, registerGoogleNonce } from './auth/customer-service.ts';
import { count, eq, inArray } from 'drizzle-orm';

const server = createCommerceServer();
let baseUrl: string;
process.env.NODE_ENV = 'test';
process.env.AUTH_LOCAL_DEV_LINKS = 'true';
process.env.ADMIN_LOCAL_SETUP_ENABLED = 'true';

before(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('Test server did not bind to a TCP port.'));
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await sql.end();
});

test('health and readiness distinguish process status from database connectivity', async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', service: 'forma-commerce-api' });
  const readiness = await fetch(`${baseUrl}/ready`);
  assert.equal(readiness.status, 200);
  assert.deepEqual(await readiness.json(), { status: 'ready', database: 'connected' });
});

test('migrated product records are typed, sample-labelled, and paginated', async () => {
  const response = await fetch(`${baseUrl}/api/products?limit=100`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json() as { total: number; limit: number; offset: number; items: Array<{ id: string; pricePaise: number; contentStatus: string }> };
  assert.equal(result.total, 100);
  assert.equal(result.items.length, 100);
  assert.equal(result.limit, 100);
  assert.equal(result.offset, 0);
  assert.ok(result.items.every((item) => item.contentStatus === 'sample'));
  assert.equal(result.items.find((item) => item.id === 'forma-001-sunday-oak-lounge-chair')?.pricePaise, 2_800_000);
});

test('category/search filters are parameterized and wildcard characters stay literal', async () => {
  const seating = await listProducts({ category: 'Seating', sort: 'featured', limit: 100, offset: 0 });
  assert.equal(seating.total, 25);
  const search = await fetch(`${baseUrl}/api/products?search=sunday&limit=100`);
  const matching = await search.json() as { total: number; items: Array<{ name: string }> };
  assert.equal(matching.total, 1);
  assert.equal(matching.items[0].name, 'Sunday Oak Lounge Chair');
  const wildcard = await fetch(`${baseUrl}/api/products?search=%25&limit=100`);
  assert.equal((await wildcard.json() as { total: number }).total, 0);
});

test('sort orders use persisted paise values with deterministic tie breaks', async () => {
  const low = await fetch(`${baseUrl}/api/products?sort=price-asc&limit=100`);
  const lowRows = (await low.json() as { items: Array<{ pricePaise: number }> }).items;
  assert.ok(lowRows.every((item, index) => index === 0 || lowRows[index - 1].pricePaise <= item.pricePaise));
  const high = await fetch(`${baseUrl}/api/products?sort=price-desc&limit=100`);
  const highRows = (await high.json() as { items: Array<{ pricePaise: number }> }).items;
  assert.ok(highRows.every((item, index) => index === 0 || highRows[index - 1].pricePaise >= item.pricePaise));
});

test('product detail resolves stable IDs and slugs and returns 404 for unknown products', async () => {
  const byId = await fetch(`${baseUrl}/api/products/forma-001-sunday-oak-lounge-chair`);
  assert.equal(byId.status, 200);
  const product = await byId.json() as { id: string; slug: string; gallery: string[] };
  assert.equal(product.id, product.slug);
  assert.equal(product.gallery.length, 3);
  const bySlug = await fetch(`${baseUrl}/api/products/${product.slug}`);
  assert.equal(bySlug.status, 200);
  const missing = await fetch(`${baseUrl}/api/products/not-a-product`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Product not found.' });
});

test('invalid parameters and unapproved cross-origin requests are rejected', async () => {
  for (const query of ['category=Unknown', 'limit=101', 'offset=-1', 'sort=discount']) {
    const response = await fetch(`${baseUrl}/api/products?${query}`);
    assert.equal(response.status, 400, query);
  }
  const forbidden = await fetch(`${baseUrl}/api/products`, { headers: { Origin: 'https://not-approved.example' } });
  assert.equal(forbidden.status, 403);
  const preflight = await fetch(`${baseUrl}/api/products`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});

function currentTotp(secret: string, now = Date.now()) {
  const key = decodeBase32(secret);
  assert.ok(key);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
  const digest = createHmac('sha1', key).update(counter).digest();
  const start = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(start) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

test('admin authentication enforces TOTP, server sessions, role grants and disabled-account revocation', async () => {
  const id = randomUUID();
  const ownerId = randomUUID();
  const newStaffEmail = `phase4-staff-${randomUUID()}@example.test`;
  const draftId = `phase4-${randomUUID()}`;
  const publishedSampleId = `phase4-public-sample-${randomUUID()}`;
  const importedId = `phase4-import-${randomUUID()}`;
  const email = `phase4-${id}@example.test`;
  const ownerEmail = `phase4-owner-${ownerId}@example.test`;
  const password = 'Valid-Phase4-Password-4729';
  const ownerPassword = 'Valid-Phase4-Owner-Password-9463';
  const totpSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const validTotp = currentTotp(totpSecret);
  const invalidTotp = `${validTotp.slice(0, 5)}${validTotp[5] === '9' ? '0' : Number(validTotp[5]) + 1}`;
  const passwordData = await hashPassword(password);
  const ownerPasswordData = await hashPassword(ownerPassword);
  await db.insert(adminUsers).values({
    id, email, passwordSalt: passwordData.salt, passwordHash: passwordData.hash,
    totpSecretEncrypted: encryptTotpSecret(totpSecret), role: 'CATALOG_MANAGER',
  });
  await db.insert(adminUsers).values({
    id: ownerId, email: ownerEmail, passwordSalt: ownerPasswordData.salt, passwordHash: ownerPasswordData.hash,
    totpSecretEncrypted: encryptTotpSecret(totpSecret), role: 'OWNER',
  });
  try {
    const invalidMfa = await fetch(`${baseUrl}/api/admin/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totp: invalidTotp }),
    });
    assert.equal(invalidMfa.status, 401);
    const login = await fetch(`${baseUrl}/api/admin/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totp: validTotp }),
    });
    assert.equal(login.status, 200);
    const session = await login.json() as { token: string; user: { id: string; role: string } };
    assert.equal(session.user.id, id);
    assert.equal(session.user.role, 'CATALOG_MANAGER');
    assert.ok(session.token.length >= 40);
    const productsResponse = await fetch(`${baseUrl}/api/admin/products`, { headers: { Authorization: `Bearer ${session.token}` } });
    assert.equal(productsResponse.status, 200);
    await db.insert(products).values({ id: publishedSampleId, slug: publishedSampleId, name: 'Published sample fixture', category: 'Seating', pricePaise: 100_000, material: 'Test only', description: 'Review fixture.', image: 'image%20assets/forma-seat-001.jpg', size: 'W 10 x D 10 x H 10 cm', lead: 'Test only', gallery: ['image%20assets/forma-seat-001.jpg'], isPublished: true, contentStatus: 'sample' });
    const editedSample = await fetch(`${baseUrl}/api/admin/products/${publishedSampleId}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated but unapproved fixture' }),
    });
    assert.equal(editedSample.status, 200);
    assert.equal((await editedSample.json() as { product: { isPublished: boolean } }).product.isPublished, false);
    assert.equal((await fetch(`${baseUrl}/api/products/${publishedSampleId}`)).status, 404);
    const publishDenied = await fetch(`${baseUrl}/api/admin/products/forma-001-sunday-oak-lounge-chair/approve`, {
      method: 'POST', headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantApprovalConfirmed: true }),
    });
    assert.equal(publishDenied.status, 403);
    const staffDenied = await fetch(`${baseUrl}/api/admin/staff`, { headers: { Authorization: `Bearer ${session.token}` } });
    assert.equal(staffDenied.status, 403);

    const created = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST', headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draftId, slug: draftId, name: 'Phase 4 Draft Chair', category: 'Seating', pricePaise: 150_000, material: 'Test timber', description: 'Integration fixture only.', image: 'image%20assets/forma-seat-001.jpg', size: 'W 10 × D 10 × H 10 cm', lead: 'Test only', gallery: ['image%20assets/forma-seat-001.jpg'] }),
    });
    assert.equal(created.status, 201);
    assert.equal((await created.json() as { product: { isPublished: boolean; contentStatus: string } }).product.isPublished, false);
    const prematurePublish = await fetch(`${baseUrl}/api/admin/products/${draftId}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    });
    assert.equal(prematurePublish.status, 403);

    const csv = `id,slug,name,category,pricePaise,material,description,image,size,lead,gallery\n${importedId},${importedId},"CSV, Draft Chair",Seating,120000,Oak,"Dry run, never published",image%20assets/forma-seat-001.jpg,W 10 x D 10 x H 10 cm,Test only,image%20assets/forma-seat-001.jpg`;
    const preview = await fetch(`${baseUrl}/api/admin/products/import/preview`, {
      method: 'POST', headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }),
    });
    assert.equal(preview.status, 200);
    assert.equal((await preview.json() as { valid: boolean; itemCount: number }).itemCount, 1);
    const imported = await fetch(`${baseUrl}/api/admin/products/import/commit`, {
      method: 'POST', headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ csv, confirmImport: true }),
    });
    assert.equal(imported.status, 201);
    const importedProduct = await db.select().from(products).where(eq(products.id, importedId));
    assert.equal(importedProduct[0].isPublished, false);
    assert.equal(importedProduct[0].contentStatus, 'sample');

    const ownerLogin = await fetch(`${baseUrl}/api/admin/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail, password: ownerPassword, totp: validTotp }),
    });
    assert.equal(ownerLogin.status, 200);
    const ownerSession = await ownerLogin.json() as { token: string };
    const staffCreated = await fetch(`${baseUrl}/api/admin/staff`, {
      method: 'POST', headers: { Authorization: `Bearer ${ownerSession.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newStaffEmail, password: 'Valid-Phase4-Staff-Password-2718', totpSecret, totpCode: validTotp, role: 'SUPPORT' }),
    });
    assert.equal(staffCreated.status, 201);
    const newStaff = await staffCreated.json() as { user: { id: string; role: string } };
    assert.equal(newStaff.user.role, 'SUPPORT');
    const staffList = await fetch(`${baseUrl}/api/admin/staff`, { headers: { Authorization: `Bearer ${ownerSession.token}` } });
    assert.equal(staffList.status, 200);
    assert.ok(((await staffList.json() as { items: Array<{ email: string }> }).items).some((row) => row.email === newStaffEmail));
    const staffDisabled = await fetch(`${baseUrl}/api/admin/staff/${newStaff.user.id}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${ownerSession.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(staffDisabled.status, 200);
    const approved = await fetch(`${baseUrl}/api/admin/products/${draftId}/approve`, {
      method: 'POST', headers: { Authorization: `Bearer ${ownerSession.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantApprovalConfirmed: true }),
    });
    assert.equal(approved.status, 200);
    const published = await fetch(`${baseUrl}/api/admin/products/${draftId}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${ownerSession.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    });
    assert.equal(published.status, 200);
    const publicItem = await fetch(`${baseUrl}/api/products/${draftId}`);
    assert.equal(publicItem.status, 200);
    assert.equal((await publicItem.json() as { contentStatus: string }).contentStatus, 'merchant_approved');
    const audit = await fetch(`${baseUrl}/api/admin/audit`, { headers: { Authorization: `Bearer ${ownerSession.token}` } });
    assert.equal(audit.status, 200);
    assert.ok(((await audit.json() as { items: Array<{ action: string }> }).items).some((item) => item.action === 'product.merchant_approved'));

    const staleLogin = await fetch(`${baseUrl}/api/admin/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totp: currentTotp(totpSecret) }),
    });
    const staleSession = await staleLogin.json() as { token: string };
    await db.update(adminSessions).set({ expiresAt: new Date(Date.now() - 1_000) }).where(eq(adminSessions.tokenHash, tokenDigest(staleSession.token)));
    const expired = await fetch(`${baseUrl}/api/admin/products`, { headers: { Authorization: `Bearer ${staleSession.token}` } });
    assert.equal(expired.status, 401);

    await db.update(adminUsers).set({ isActive: false }).where(eq(adminUsers.id, id));
    const disabled = await fetch(`${baseUrl}/api/admin/session`, { headers: { Authorization: `Bearer ${session.token}` } });
    assert.equal(disabled.status, 401);
  } finally {
    await db.delete(adminAuditLogs).where(eq(adminAuditLogs.actorId, id));
    await db.delete(adminAuditLogs).where(eq(adminAuditLogs.actorId, ownerId));
    await db.delete(adminUsers).where(eq(adminUsers.email, newStaffEmail));
    await db.delete(productInventory).where(inArray(productInventory.productId, [draftId, publishedSampleId, importedId]));
    await db.delete(products).where(eq(products.id, draftId));
    await db.delete(products).where(eq(products.id, publishedSampleId));
    await db.delete(products).where(eq(products.id, importedId));
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    await db.delete(adminUsers).where(eq(adminUsers.id, ownerId));
  }
});

test('customer signup verifies email, profile uses PostgreSQL, reset is single-use and revokes sessions', async () => {
  const email = `phase4-customer-${randomUUID()}@example.test`;
  const password = 'Valid-Customer-Password-4927';
  const nextPassword = 'Another-Customer-Password-5831';
  let customerId: string | undefined;
  try {
    const registration = await fetch(`${baseUrl}/api/customers/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName: 'Test Customer', phone: '+91 9876543210', password }),
    });
    assert.equal(registration.status, 202);
    const registered = await registration.json() as { previewUrl: string };
    assert.ok(registered.previewUrl.includes('/account?verify='));
    const verifyToken = new URL(registered.previewUrl).searchParams.get('verify');
    assert.ok(verifyToken);
    const verified = await fetch(`${baseUrl}/api/customers/verify-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: verifyToken }),
    });
    assert.equal(verified.status, 200);
    const firstSession = await verified.json() as { token: string; customer: { id: string; emailVerified: boolean } };
    customerId = firstSession.customer.id;
    assert.equal(firstSession.customer.emailVerified, true);
    const profile = await fetch(`${baseUrl}/api/customers/profile`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${firstSession.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Updated Test Customer', phone: null }),
    });
    assert.equal(profile.status, 200);
    const profileData = await profile.json() as { customer: { fullName: string; phone: string | null } };
    assert.equal(profileData.customer.fullName, 'Updated Test Customer');
    assert.equal(profileData.customer.phone, null);
    const login = await fetch(`${baseUrl}/api/customers/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    assert.equal(login.status, 200);
    const resetResponse = await fetch(`${baseUrl}/api/customers/forgot-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    });
    const resetData = await resetResponse.json() as { previewUrl: string };
    const resetToken = new URL(resetData.previewUrl).searchParams.get('reset');
    assert.ok(resetToken);
    const reset = await fetch(`${baseUrl}/api/customers/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, password: nextPassword }),
    });
    assert.equal(reset.status, 200);
    const replay = await fetch(`${baseUrl}/api/customers/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, password }),
    });
    assert.equal(replay.status, 400);
    const oldSession = await fetch(`${baseUrl}/api/customers/session`, { headers: { Authorization: `Bearer ${firstSession.token}` } });
    assert.equal(oldSession.status, 401);
    const newLogin = await fetch(`${baseUrl}/api/customers/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: nextPassword }),
    });
    assert.equal(newLogin.status, 200);
  } finally {
    if (customerId) {
      await db.delete(customerAuthTokens).where(eq(customerAuthTokens.customerId, customerId));
      await db.delete(customerSessions).where(eq(customerSessions.customerId, customerId));
      await db.delete(customers).where(eq(customers.id, customerId));
    } else await db.delete(customers).where(eq(customers.email, email));
  }
});

test('Google OAuth nonce is registered and consumed exactly once', async () => {
  const nonce = randomBytes(32).toString('base64url');
  const nonceHash = tokenDigest(nonce);
  try {
    await registerGoogleNonce(nonce);
    assert.equal(await consumeGoogleNonce(nonce), true);
    assert.equal(await consumeGoogleNonce(nonce), false);
  } finally {
    await db.delete(customerOAuthNonces).where(eq(customerOAuthNonces.nonceHash, nonceHash));
  }
});

test('local initial owner setup is one-time, TOTP-verified and disabled in production', async () => {
  const [{ value: existingAdmins }] = await db.select({ value: count() }).from(adminUsers);
  if (existingAdmins > 0) return;
  const email = `phase4-bootstrap-${randomUUID()}@example.test`;
  let createdId: string | undefined;
  try {
    const status = await fetch(`${baseUrl}/api/admin/bootstrap/status`);
    assert.equal(status.status, 200);
    assert.equal((await status.json() as { setupAvailable: boolean }).setupAvailable, true);
    const begin = await fetch(`${baseUrl}/api/admin/bootstrap/begin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Valid-Bootstrap-Password-8246' }),
    });
    assert.equal(begin.status, 200);
    const setup = await begin.json() as { setupToken: string; totpSecret: string };
    const complete = await fetch(`${baseUrl}/api/admin/bootstrap/complete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setupToken: setup.setupToken, totp: currentTotp(setup.totpSecret) }),
    });
    assert.equal(complete.status, 201);
    const owner = await complete.json() as { token: string; user: { id: string; role: string } };
    createdId = owner.user.id;
    assert.equal(owner.user.role, 'OWNER');
    const closed = await fetch(`${baseUrl}/api/admin/bootstrap/status`);
    assert.equal((await closed.json() as { setupAvailable: boolean }).setupAvailable, false);
    process.env.NODE_ENV = 'production';
    const hidden = await fetch(`${baseUrl}/api/admin/bootstrap/status`);
    assert.equal(hidden.status, 404);
    process.env.NODE_ENV = 'test';
  } finally {
    process.env.NODE_ENV = 'test';
    if (createdId) await db.delete(adminUsers).where(eq(adminUsers.id, createdId));
  }
});

test('owner staff invitation lets the worker set their own password and enroll TOTP exactly once', async () => {
  const ownerId = randomUUID();
  const ownerEmail = `phase4-inviter-${ownerId}@example.test`;
  const invitedEmail = `phase4-invitee-${ownerId}@example.test`;
  const ownerSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const ownerPassword = 'Valid-Invitation-Owner-Password-5274';
  const ownerHash = await hashPassword(ownerPassword);
  let createdStaffId: string | undefined;
  let ownerSessionHash: string | undefined;
  let staffSessionHash: string | undefined;
  try {
    await db.insert(adminUsers).values({ id: ownerId, email: ownerEmail, passwordSalt: ownerHash.salt, passwordHash: ownerHash.hash, totpSecretEncrypted: encryptTotpSecret(ownerSecret), role: 'OWNER' });
    const login = await fetch(`${baseUrl}/api/admin/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerEmail, password: ownerPassword, totp: currentTotp(ownerSecret) }) });
    assert.equal(login.status, 200);
    const owner = await login.json() as { token: string };
    ownerSessionHash = tokenDigest(owner.token);

    const unauthorized = await fetch(`${baseUrl}/api/admin/invitations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invitedEmail, role: 'SUPPORT' }) });
    assert.equal(unauthorized.status, 401);
    const sent = await fetch(`${baseUrl}/api/admin/invitations`, { method: 'POST', headers: { Authorization: `Bearer ${owner.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invitedEmail, role: 'SUPPORT' }) });
    assert.equal(sent.status, 201);
    const delivery = await sent.json() as { delivered: boolean; previewUrl?: string; invitation: { role: string } };
    assert.equal(delivery.delivered, false);
    assert.equal(delivery.invitation.role, 'SUPPORT');
    assert.ok(delivery.previewUrl);
    const inviteToken = new URL(delivery.previewUrl!).searchParams.get('token');
    assert.ok(inviteToken);

    const inspected = await fetch(`${baseUrl}/api/admin/invitations/${inviteToken}`);
    assert.equal(inspected.status, 200);
    assert.deepEqual(await inspected.json().then((value) => { const { email, role } = value as { email: string; role: string }; return { email, role }; }), { email: invitedEmail, role: 'SUPPORT' });
    const prepared = await fetch(`${baseUrl}/api/admin/invitations/${inviteToken}/prepare`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'Worker-Owned-Password-5726' }) });
    assert.equal(prepared.status, 200);
    const enrollment = await prepared.json() as { setupToken: string; totpSecret: string; otpauthUri: string };
    assert.match(enrollment.otpauthUri, /digits=6/);
    const invalidCode = await fetch(`${baseUrl}/api/admin/invitations/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setupToken: enrollment.setupToken, totp: '000000' }) });
    assert.equal(invalidCode.status, 400);

    const completed = await fetch(`${baseUrl}/api/admin/invitations/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setupToken: enrollment.setupToken, totp: currentTotp(enrollment.totpSecret) }) });
    assert.equal(completed.status, 201);
    const staff = await completed.json() as { token: string; user: { id: string; email: string; role: string } };
    createdStaffId = staff.user.id;
    staffSessionHash = tokenDigest(staff.token);
    assert.deepEqual({ email: staff.user.email, role: staff.user.role }, { email: invitedEmail, role: 'SUPPORT' });
    const replay = await fetch(`${baseUrl}/api/admin/invitations/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setupToken: enrollment.setupToken, totp: currentTotp(enrollment.totpSecret) }) });
    assert.equal(replay.status, 410);
    const invitation = await db.select().from(adminInvitations).where(eq(adminInvitations.email, invitedEmail));
    assert.equal(invitation[0].usedAt instanceof Date, true);
  } finally {
    if (staffSessionHash) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, staffSessionHash));
    if (ownerSessionHash) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, ownerSessionHash));
    await db.delete(adminAuditLogs).where(eq(adminAuditLogs.actorId, ownerId));
    await db.delete(adminAuditLogs).where(eq(adminAuditLogs.targetId, createdStaffId ?? invitedEmail));
    await db.delete(adminInvitations).where(eq(adminInvitations.email, invitedEmail));
    if (createdStaffId) await db.delete(adminUsers).where(eq(adminUsers.id, createdStaffId));
    await db.delete(adminUsers).where(eq(adminUsers.id, ownerId));
  }
});

test('admin password recovery is generic, one-use, revokes sessions and keeps MFA enabled', async () => {
  const adminId = randomUUID();
  const email = `phase4-recovery-${adminId}@example.test`;
  const oldPassword = 'Previously-Strong-Admin-Password-4821';
  const newPassword = 'Newly-Strong-Admin-Password-7392';
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const oldHash = await hashPassword(oldPassword);
  let sessionHash: string | undefined;
  try {
    await db.insert(adminUsers).values({ id: adminId, email, passwordSalt: oldHash.salt, passwordHash: oldHash.hash, totpSecretEncrypted: encryptTotpSecret(secret), role: 'OWNER' });
    const login = await fetch(`${baseUrl}/api/admin/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: oldPassword, totp: currentTotp(secret) }) });
    assert.equal(login.status, 200);
    const session = await login.json() as { token: string };
    sessionHash = tokenDigest(session.token);

    const unknown = await fetch(`${baseUrl}/api/admin/password-reset/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'missing-admin@example.test' }) });
    const unknownBody = await unknown.json() as { message: string; previewUrl?: string };
    assert.equal(unknown.status, 202);
    assert.equal(typeof unknownBody.message, 'string');
    assert.equal(unknownBody.previewUrl, undefined);

    const requested = await fetch(`${baseUrl}/api/admin/password-reset/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    assert.equal(requested.status, 202);
    const { previewUrl } = await requested.json() as { previewUrl?: string };
    assert.ok(previewUrl);
    const token = new URL(previewUrl!).searchParams.get('reset');
    assert.ok(token);
    const storedToken = await db.select().from(adminPasswordResetTokens).where(eq(adminPasswordResetTokens.adminId, adminId));
    assert.equal(storedToken.length, 1);
    assert.equal(storedToken[0].tokenHash, tokenDigest(token!));

    const changed = await fetch(`${baseUrl}/api/admin/password-reset/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: newPassword }) });
    assert.equal(changed.status, 200);
    assert.equal((await changed.json() as { message: string }).message.includes('authenticator is still required'), true);
    const [updated] = await db.select().from(adminUsers).where(eq(adminUsers.id, adminId));
    assert.equal(await passwordMatches(newPassword, updated.passwordSalt, updated.passwordHash), true);
    assert.equal(await passwordMatches(oldPassword, updated.passwordSalt, updated.passwordHash), false);
    assert.equal((await db.select().from(adminSessions).where(eq(adminSessions.tokenHash, sessionHash!))).length, 0);
    assert.equal((await db.select().from(adminAuditLogs).where(eq(adminAuditLogs.action, 'admin.password_reset'))).some((row) => row.targetId === adminId), true);

    const replay = await fetch(`${baseUrl}/api/admin/password-reset/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: 'Another-Strong-Password-2751' }) });
    assert.equal(replay.status, 400);
    const withMfa = await fetch(`${baseUrl}/api/admin/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: newPassword, totp: currentTotp(secret) }) });
    assert.equal(withMfa.status, 200);
    const newSession = await withMfa.json() as { token: string };
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenDigest(newSession.token)));
  } finally {
    if (sessionHash) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sessionHash));
    await db.delete(adminAuditLogs).where(eq(adminAuditLogs.targetId, adminId));
    await db.delete(adminPasswordResetTokens).where(eq(adminPasswordResetTokens.adminId, adminId));
    await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
  }
});

test('authentication throttles increment atomically in PostgreSQL without storing client IPs', async () => {
  const clientIp = `203.0.113.${randomUUID()}`;
  const route = '/test/rate-limit';
  const now = new Date('2099-10-25T12:34:30.000Z');
  const results = await Promise.all([
    consumeRateLimit(clientIp, route, 2, now),
    consumeRateLimit(clientIp, route, 2, now),
    consumeRateLimit(clientIp, route, 2, now),
  ]);
  try {
    assert.deepEqual(results.sort(), [false, false, true]);
    const buckets = await db.select().from(authRateLimitBuckets).where(eq(authRateLimitBuckets.windowStart, new Date('2099-10-25T12:34:00.000Z')));
    const bucket = buckets.find((row) => row.attempts === 3);
    assert.ok(bucket);
    assert.equal(bucket.bucketKey.includes(clientIp), false);
    assert.equal(bucket.bucketKey.length, 64);
  } finally {
    const buckets = await db.select().from(authRateLimitBuckets).where(eq(authRateLimitBuckets.windowStart, new Date('2099-10-25T12:34:00.000Z')));
    const bucket = buckets.find((row) => row.attempts === 3);
    if (bucket) await db.delete(authRateLimitBuckets).where(eq(authRateLimitBuckets.bucketKey, bucket.bucketKey));
  }
});

test('administrator authenticator-loss recovery requires email token and a verified replacement TOTP', async () => {
  const adminId = randomUUID();
  const email = `phase4-mfa-recovery-${adminId}@example.test`;
  const password = 'Replacement-Admin-Password-8402';
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const passwordData = await hashPassword('Old-Admin-Password-2518');
  let sessionHash: string | undefined;
  try {
    await db.insert(adminUsers).values({ id: adminId, email, passwordSalt: passwordData.salt, passwordHash: passwordData.hash, totpSecretEncrypted: encryptTotpSecret(secret), role: 'OWNER' });
    const login = await fetch(`${baseUrl}/api/admin/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Old-Admin-Password-2518', totp: currentTotp(secret) }) });
    assert.equal(login.status, 200);
    const session = await login.json() as { token: string };
    sessionHash = tokenDigest(session.token);

    const requested = await fetch(`${baseUrl}/api/admin/access-recovery/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    assert.equal(requested.status, 202);
    const { previewUrl } = await requested.json() as { previewUrl?: string };
    assert.ok(previewUrl);
    const token = new URL(previewUrl!).searchParams.get('recover');
    assert.ok(token);
    const prepared = await fetch(`${baseUrl}/api/admin/access-recovery/prepare`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    assert.equal(prepared.status, 200);
    const enrollment = await prepared.json() as { secret: string; otpauthUri: string };
    assert.match(enrollment.otpauthUri, /digits=6/);
    assert.equal((await db.select().from(adminPasswordResetTokens).where(eq(adminPasswordResetTokens.tokenHash, tokenDigest(token!))))[0].recoveryTotpSecretEncrypted?.includes(enrollment.secret), false);

    const invalidCode = await fetch(`${baseUrl}/api/admin/access-recovery/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password, totp: '000000' }) });
    assert.equal(invalidCode.status, 400);
    const complete = await fetch(`${baseUrl}/api/admin/access-recovery/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password, totp: currentTotp(enrollment.secret) }) });
    assert.equal(complete.status, 200);
    assert.equal((await db.select().from(adminSessions).where(eq(adminSessions.tokenHash, sessionHash!))).length, 0);

    const oldAuthenticator = await fetch(`${baseUrl}/api/admin/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, totp: currentTotp(secret) }) });
    assert.equal(oldAuthenticator.status, 401);
    const newAuthenticator = await fetch(`${baseUrl}/api/admin/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, totp: currentTotp(enrollment.secret) }) });
    assert.equal(newAuthenticator.status, 200);
    const recoveredSession = await newAuthenticator.json() as { token: string };
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenDigest(recoveredSession.token)));
    const replay = await fetch(`${baseUrl}/api/admin/access-recovery/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: 'Other-Admin-Password-9462', totp: currentTotp(enrollment.secret) }) });
    assert.equal(replay.status, 400);
    assert.equal((await db.select().from(adminAuditLogs).where(eq(adminAuditLogs.action, 'admin.access_recovered'))).some((row) => row.targetId === adminId), true);
  } finally {
    if (sessionHash) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sessionHash));
    await db.delete(adminAuditLogs).where(eq(adminAuditLogs.targetId, adminId));
    await db.delete(adminPasswordResetTokens).where(eq(adminPasswordResetTokens.adminId, adminId));
    await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
  }
});
