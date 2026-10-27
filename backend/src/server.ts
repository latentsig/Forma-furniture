import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { and, count, desc, eq, isNull, sql as drizzleSql } from 'drizzle-orm';
import { sql } from './db/connection.ts';
import { db } from './db/connection.ts';
import { getPublishedProduct, listProducts, productCategories, type ProductSort } from './catalog/product-service.ts';
import { validateProductInput } from './catalog/product-validation.ts';
import { previewProductCsv } from './catalog/product-csv.ts';
import { adminAuditLogs, adminInvitations, adminSessions, adminUsers, customers, productInventory, products } from './db/schema.ts';
import { authenticateAdmin, decodeBase32, encryptTotpSecret, generateTotpSecret, getAdminSession, hashPassword, normalizeEmail, revokeAdminSession, safeAdmin, tokenDigest, type SafeAdmin, validatePassword, verifyTotp } from './auth/service.ts';
import { hasPermission, type Permission } from './auth/rbac.ts';
import { consumeGoogleNonce, createCustomer, createCustomerSession, findCustomerByFacebook, findCustomerByGoogle, getCustomerSession, issueCustomerToken, loginCustomer, registerGoogleNonce, resetCustomerPassword, revokeCustomerSession, safeCustomer, validateCustomerPassword, verifyCustomerEmail } from './auth/customer-service.ts';
import { sendCustomerActionEmail } from './auth/customer-email.ts';
import { verifyGoogleIdToken } from './auth/google-id-token.ts';
import { exchangeFacebookCode } from './auth/facebook-auth.ts';
import { cancelAdminInvitation, completeAdminInvitation, createAdminInvitation, inspectAdminInvitation, isAdminRole, listAdminInvitations, prepareAdminInvitation } from './auth/admin-invitations.ts';
import { sendAdminInvitation } from './auth/admin-invitation-email.ts';
import { sendAdminAccessRecovery, sendAdminPasswordReset } from './auth/admin-password-email.ts';
import { completeAdminAccessRecovery, issueAdminPasswordReset, prepareAdminAccessRecovery, resetAdminPassword } from './auth/admin-password-recovery.ts';
import { consumeRateLimit } from './auth/rate-limit.ts';
import { addCartLine, cancelCodOrder, CommerceError, createDeliveryQuote, expireCodReservations, listCustomerOrders, listStaffOrders, placeCodOrder, readCart, resolveCart, setCartLine, clearCart } from './commerce/service.ts';
import { commerceOrderLines, commerceOrders } from './db/schema.ts';
import { getBackendRuntimeConfig } from './runtime-config.ts';

const allowedOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const sorts: ProductSort[] = ['featured', 'price-asc', 'price-desc', 'name'];
const pendingLocalOwners = new Map<string, { email: string; passwordSalt: string; passwordHash: string; totpSecret: string; expiresAt: number; attempts: number }>();

type JsonObject = Record<string, unknown>;
async function readJson(request: IncomingMessage, maximumBytes = 64 * 1024): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) throw new Error('Request body is too large.');
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Request body must be valid JSON.'); }
}

function isRecord(value: unknown): value is JsonObject { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function bearer(request: IncomingMessage) {
  const value = request.headers.authorization;
  return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
}
async function authorize(request: IncomingMessage, response: ServerResponse, permission: Permission): Promise<SafeAdmin | null> {
  const user = await getAdminSession(bearer(request));
  if (!user) { sendJson(response, 401, { error: 'Admin authentication required.' }); return null; }
  if (!hasPermission(user.role, permission)) { sendJson(response, 403, { error: 'Insufficient permission.' }); return null; }
  return user;
}
async function loginRateLimited(request: IncomingMessage) {
  return consumeRateLimit(request.socket.remoteAddress ?? 'unknown', request.url?.split('?')[0] ?? '/', 10);
}
async function customerLoginRateLimited(request: IncomingMessage) {
  return consumeRateLimit(request.socket.remoteAddress ?? 'unknown', request.url?.split('?')[0] ?? '/', 20);
}
function isLoopbackRequest(request: IncomingMessage) {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '');
}
async function writeAudit(actorId: string, action: string, targetId: string, metadata: Record<string, unknown> = {}) {
  await db.insert(adminAuditLogs).values({ id: randomUUID(), actorId, action, targetId, metadata });
}

function sendJson(response: ServerResponse, status: number, body: unknown, cache = 'no-store') {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(JSON.stringify(body));
}

function cors(request: IncomingMessage, response: ServerResponse) {
  const origin = request.headers.origin;
  if (origin && origin !== allowedOrigin) {
    sendJson(response, 403, { error: 'Origin not allowed' });
    return false;
  }
  response.setHeader('Vary', 'Origin');
  if (origin === allowedOrigin) response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  return true;
}

function parseQuery(url: URL) {
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search')?.trim() || undefined;
  const sort = url.searchParams.get('sort') ?? 'featured';
  const limitText = url.searchParams.get('limit') ?? '24';
  const offsetText = url.searchParams.get('offset') ?? '0';
  const limit = Number(limitText);
  const offset = Number(offsetText);
  if (category && !productCategories.includes(category as (typeof productCategories)[number])) return { error: 'Invalid product category.' } as const;
  if (search && search.length > 120) return { error: 'Search must be 120 characters or fewer.' } as const;
  if (!sorts.includes(sort as ProductSort)) return { error: 'Invalid sort order.' } as const;
  if (!/^\d+$/.test(limitText) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return { error: 'Limit must be an integer between 1 and 100.' } as const;
  if (!/^\d+$/.test(offsetText) || !Number.isSafeInteger(offset) || offset > 100_000) return { error: 'Offset must be an integer between 0 and 100000.' } as const;
  return { query: { category: category as (typeof productCategories)[number] | undefined, search, sort: sort as ProductSort, limit, offset } } as const;
}

export function createCommerceServer(): Server {
  return createServer((request, response) => {
    void (async () => {
    if (!cors(request, response)) return;
    if (request.method === 'OPTIONS') {
      response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
      response.end();
      return;
    }

    let url: URL;
    try {
      url = new URL(request.url ?? '/', 'http://localhost');
    } catch {
      sendJson(response, 400, { error: 'Invalid request URL.' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok', service: 'forma-commerce-api' });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/ready') {
      try {
        await sql`select 1`;
        sendJson(response, 200, { status: 'ready', database: 'connected' });
      } catch {
        sendJson(response, 503, { status: 'not-ready', database: 'unavailable' });
      }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/register') {
      if (await customerLoginRateLimited(request)) { sendJson(response, 429, { error: 'Too many account attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string' || typeof body.fullName !== 'string' || (body.phone !== undefined && typeof body.phone !== 'string') || !validateCustomerPassword(body.password)) {
          sendJson(response, 400, { error: 'Provide your name, email and a password of at least 12 characters with upper/lowercase letters and a number.' }); return;
        }
        const email = normalizeEmail(body.email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || body.fullName.trim().length < 2 || body.fullName.trim().length > 160 || (typeof body.phone === 'string' && body.phone.length > 32)) {
          sendJson(response, 400, { error: 'Check your name, email address and optional phone number.' }); return;
        }
        const [existing] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
        let customer = existing;
        if (!customer) customer = await createCustomer({ email, fullName: body.fullName, phone: typeof body.phone === 'string' ? body.phone : undefined, password: body.password });
        if (!customer.emailVerifiedAt) {
          const issued = await issueCustomerToken(customer.id, 'email_verification');
          const delivery = await sendCustomerActionEmail(email, 'verify', issued.token);
          sendJson(response, 202, { message: 'If this address can be registered, a verification link has been sent.', ...(delivery.previewUrl ? { previewUrl: delivery.previewUrl } : {}) });
          return;
        }
        sendJson(response, 202, { message: 'If this address can be registered, check your email for next steps.' });
      } catch {
        sendJson(response, 503, { error: 'Account setup is temporarily unavailable. Check email configuration and try again.' });
      }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/verify-email') {
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.token !== 'string') { sendJson(response, 400, { error: 'Verification token is required.' }); return; }
        const customer = await verifyCustomerEmail(body.token);
        if (!customer) { sendJson(response, 400, { error: 'This verification link is invalid, expired, or already used.' }); return; }
        const session = await createCustomerSession(customer);
        sendJson(response, 200, { token: session.token, customer: session.customer, expiresAt: session.expiresAt.toISOString() });
      } catch { sendJson(response, 503, { error: 'Email verification is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/request-email-verification') {
      if (await customerLoginRateLimited(request)) { sendJson(response, 429, { error: 'Too many account attempts. Try again in one minute.' }); return; }
      try {
        const current = await getCustomerSession(bearer(request));
        if (!current) { sendJson(response, 401, { error: 'Customer sign-in required.' }); return; }
        if (current.emailVerified) { sendJson(response, 200, { message: 'Your email is already verified.' }); return; }
        const issued = await issueCustomerToken(current.id, 'email_verification');
        const delivery = await sendCustomerActionEmail(current.email, 'verify', issued.token);
        sendJson(response, 200, { message: 'A fresh verification link has been sent.', ...(delivery.previewUrl ? { previewUrl: delivery.previewUrl } : {}) });
      } catch { sendJson(response, 503, { error: 'Verification email is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/login') {
      if (await customerLoginRateLimited(request)) { sendJson(response, 429, { error: 'Too many account attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 254 || body.password.length > 256) { sendJson(response, 400, { error: 'Email and password are required.' }); return; }
        const session = await loginCustomer(body.email, body.password);
        if (!session) { sendJson(response, 401, { error: 'Sign-in failed. Check your details or verify your email address.' }); return; }
        sendJson(response, 200, { token: session.token, customer: session.customer, expiresAt: session.expiresAt.toISOString() });
      } catch { sendJson(response, 503, { error: 'Sign-in is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/forgot-password') {
      if (await customerLoginRateLimited(request)) { sendJson(response, 429, { error: 'Too many account attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || body.email.length > 254) { sendJson(response, 400, { error: 'Provide your account email address.' }); return; }
        const email = normalizeEmail(body.email);
        const [customer] = await db.select().from(customers).where(and(eq(customers.email, email), isNull(customers.googleSubject))).limit(1);
        let previewUrl: string | undefined;
        if (customer?.emailVerifiedAt && customer.passwordHash) {
          const issued = await issueCustomerToken(customer.id, 'password_reset');
          const delivery = await sendCustomerActionEmail(email, 'reset', issued.token);
          previewUrl = delivery.previewUrl;
        }
        sendJson(response, 202, { message: 'If a password account exists for that address, reset instructions have been sent.', ...(previewUrl ? { previewUrl } : {}) });
      } catch { sendJson(response, 202, { message: 'If a password account exists for that address, reset instructions have been sent.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/reset-password') {
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.token !== 'string' || typeof body.password !== 'string' || !validateCustomerPassword(body.password)) { sendJson(response, 400, { error: 'Use the reset link and a password of at least 12 characters with upper/lowercase letters and a number.' }); return; }
        if (!await resetCustomerPassword(body.token, body.password)) { sendJson(response, 400, { error: 'This reset link is invalid, expired, or already used.' }); return; }
        sendJson(response, 200, { message: 'Password updated. Sign in with your new password.' });
      } catch { sendJson(response, 503, { error: 'Password reset is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/google') {
      try {
        const body = await readJson(request, 16 * 1024);
        if (!isRecord(body) || typeof body.idToken !== 'string' || typeof body.nonce !== 'string') { sendJson(response, 400, { error: 'Google identity token is required.' }); return; }
        const identity = await verifyGoogleIdToken(body.idToken, body.nonce);
        if (!identity) { sendJson(response, 401, { error: 'Google sign-in could not be verified.' }); return; }
        if (!await consumeGoogleNonce(body.nonce)) { sendJson(response, 401, { error: 'Google sign-in request expired or was already used.' }); return; }
        const customer = await findCustomerByGoogle(identity.sub, identity.email, identity.name);
        const session = await createCustomerSession(customer);
        sendJson(response, 200, { token: session.token, customer: session.customer, expiresAt: session.expiresAt.toISOString() });
      } catch { sendJson(response, 503, { error: 'Google sign-in is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/google/nonce') {
      if (await customerLoginRateLimited(request)) { sendJson(response, 429, { error: 'Too many account attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request, 4 * 1024);
        if (!isRecord(body) || typeof body.nonce !== 'string') { sendJson(response, 400, { error: 'Google sign-in nonce is required.' }); return; }
        await registerGoogleNonce(body.nonce);
        sendJson(response, 201, { status: 'nonce_registered' });
      } catch { sendJson(response, 400, { error: 'Google sign-in nonce could not be registered.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/customers/facebook') {
      if (await customerLoginRateLimited(request)) { sendJson(response, 429, { error: 'Too many account attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request, 8 * 1024);
        if (!isRecord(body) || typeof body.code !== 'string' || typeof body.redirectUri !== 'string' || body.code.length > 4096 || body.redirectUri.length > 2048) { sendJson(response, 400, { error: 'Facebook authorization response is invalid.' }); return; }
        const identity = await exchangeFacebookCode(body.code, body.redirectUri);
        if (!identity) { sendJson(response, 401, { error: 'Facebook sign-in could not be verified. Check that the app has the email permission enabled.' }); return; }
        const customer = await findCustomerByFacebook(identity.id, identity.email, identity.name);
        if (!customer) { sendJson(response, 409, { error: 'An account already uses this email. Sign in to that account first; accounts are not linked automatically.' }); return; }
        const session = await createCustomerSession(customer);
        sendJson(response, 200, { token: session.token, customer: session.customer, expiresAt: session.expiresAt.toISOString() });
      } catch { sendJson(response, 503, { error: 'Facebook sign-in is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/customers/session') {
      const customer = await getCustomerSession(bearer(request));
      if (!customer) { sendJson(response, 401, { error: 'Customer sign-in required.' }); return; }
      sendJson(response, 200, { customer });
      return;
    }
    if (request.method === 'DELETE' && url.pathname === '/api/customers/session') {
      await revokeCustomerSession(bearer(request));
      sendJson(response, 200, { status: 'signed_out' });
      return;
    }
    if (url.pathname.startsWith('/api/commerce/')) {
      try {
        const action = url.pathname.slice('/api/commerce/'.length);
        const customer = await getCustomerSession(bearer(request));
        const guestToken = request.headers['x-forma-guest-cart'];
        if (typeof guestToken !== 'string') { sendJson(response, 400, { error: 'Cart session is required.' }); return; }
        const cart = await resolveCart({ guestToken, customer });
        if (request.method === 'GET' && action === 'cart') { sendJson(response, 200, { cart: await readCart(cart.id) }); return; }
        if (request.method === 'POST' && action === 'cart/lines') {
          const body = await readJson(request);
          if (!isRecord(body) || typeof body.productId !== 'string') { sendJson(response, 400, { error: 'Product is required.' }); return; }
          await addCartLine(cart.id, body.productId);
          sendJson(response, 200, { cart: await readCart(cart.id) }); return;
        }
        if (request.method === 'PUT' && action === 'cart/lines') {
          const body = await readJson(request);
          if (!isRecord(body) || typeof body.productId !== 'string' || typeof body.quantity !== 'number') { sendJson(response, 400, { error: 'Product and quantity are required.' }); return; }
          await setCartLine(cart.id, body.productId, body.quantity);
          sendJson(response, 200, { cart: await readCart(cart.id) }); return;
        }
        if (request.method === 'DELETE' && action === 'cart') { await clearCart(cart.id); sendJson(response, 200, { cart: await readCart(cart.id) }); return; }
        if (request.method === 'POST' && action === 'quotes') {
          if (!customer) { sendJson(response, 401, { error: 'Sign in to request delivery.' }); return; }
          const body = await readJson(request);
          if (!isRecord(body) || typeof body.postcode !== 'string') { sendJson(response, 400, { error: 'Delivery PIN code is required.' }); return; }
          const quote = await createDeliveryQuote(cart.id, customer, body.postcode);
          sendJson(response, 201, { quote }); return;
        }
        if (request.method === 'POST' && action === 'orders') {
          if (!customer) { sendJson(response, 401, { error: 'Sign in to place an order.' }); return; }
          const body = await readJson(request);
          if (!isRecord(body) || typeof body.quoteId !== 'string') { sendJson(response, 400, { error: 'A delivery quote is required.' }); return; }
          await expireCodReservations();
          const idempotencyKey = request.headers['idempotency-key'];
          const placed = await placeCodOrder(cart.id, customer, body.quoteId, body.address, body.fulfillmentConsent === true, typeof idempotencyKey === 'string' ? idempotencyKey : '');
          sendJson(response, placed.replayed ? 200 : 201, { order: placed.order, lines: placed.lines, replayed: placed.replayed }); return;
        }
        if (request.method === 'GET' && action === 'orders') {
          if (!customer) { sendJson(response, 401, { error: 'Customer sign-in required.' }); return; }
          sendJson(response, 200, { items: await listCustomerOrders(customer.id) }); return;
        }
        sendJson(response, 404, { error: 'Commerce route not found.' });
      } catch (error) {
        if (error instanceof CommerceError) { sendJson(response, error.status, { error: error.message }); return; }
        sendJson(response, 503, { error: 'Commerce service is temporarily unavailable.' });
      }
      return;
    }
    if (request.method === 'PATCH' && url.pathname === '/api/customers/profile') {
      const customerSession = await getCustomerSession(bearer(request));
      if (!customerSession) { sendJson(response, 401, { error: 'Customer sign-in required.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.fullName !== 'string' || body.fullName.trim().length < 2 || body.fullName.trim().length > 160 || (body.phone !== null && typeof body.phone !== 'string')) { sendJson(response, 400, { error: 'Provide a valid name and optional phone number.' }); return; }
        const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
        if (phone && (phone.length > 32 || !/^\+?[0-9 ()-]{7,32}$/.test(phone))) { sendJson(response, 400, { error: 'Check your phone number.' }); return; }
        const [updated] = await db.update(customers).set({ fullName: body.fullName.trim(), phone, updatedAt: new Date() }).where(eq(customers.id, customerSession.id)).returning();
        sendJson(response, 200, { customer: safeCustomer(updated) });
      } catch { sendJson(response, 503, { error: 'Profile update is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/bootstrap/status') {
      if (process.env.NODE_ENV === 'production' || process.env.ADMIN_LOCAL_SETUP_ENABLED !== 'true' || !isLoopbackRequest(request)) { sendJson(response, 404, { setupAvailable: false }); return; }
      const [{ value: existingAdmins }] = await db.select({ value: count() }).from(adminUsers);
      sendJson(response, 200, { setupAvailable: existingAdmins === 0, suggestedEmail: existingAdmins === 0 ? (process.env.OWNER_EMAIL ?? '') : '' });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/bootstrap/begin') {
      if (process.env.NODE_ENV === 'production' || process.env.ADMIN_LOCAL_SETUP_ENABLED !== 'true' || !isLoopbackRequest(request)) { sendJson(response, 404, { error: 'Initial setup is unavailable.' }); return; }
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many setup attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254 || !validatePassword(body.password)) {
          sendJson(response, 400, { error: 'Use a valid email and a 15+ character password with lowercase, uppercase and a digit.' }); return;
        }
        const [{ value: existingAdmins }] = await db.select({ value: count() }).from(adminUsers);
        if (existingAdmins > 0) { sendJson(response, 409, { error: 'An owner already exists. Initial setup is permanently closed.' }); return; }
        for (const [key, value] of pendingLocalOwners) if (value.expiresAt <= Date.now()) pendingLocalOwners.delete(key);
        if (pendingLocalOwners.size >= 5) { sendJson(response, 429, { error: 'Too many pending setup requests. Wait ten minutes and try again.' }); return; }
        const passwordData = await hashPassword(body.password);
        const totpSecret = generateTotpSecret();
        const setupToken = randomBytes(32).toString('base64url');
        pendingLocalOwners.set(tokenDigest(setupToken), { email: normalizeEmail(body.email), passwordSalt: passwordData.salt, passwordHash: passwordData.hash, totpSecret, expiresAt: Date.now() + 10 * 60_000, attempts: 0 });
        const uri = `otpauth://totp/${encodeURIComponent(`Forma Furniture:${normalizeEmail(body.email)}`)}?secret=${totpSecret}&issuer=Forma%20Furniture&algorithm=SHA1&digits=6&period=30`;
        sendJson(response, 200, { setupToken, totpSecret, otpauthUri: uri, expiresInSeconds: 600 });
      } catch { sendJson(response, 503, { error: 'Owner setup is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/bootstrap/complete') {
      if (process.env.NODE_ENV === 'production' || process.env.ADMIN_LOCAL_SETUP_ENABLED !== 'true' || !isLoopbackRequest(request)) { sendJson(response, 404, { error: 'Initial setup is unavailable.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.setupToken !== 'string' || typeof body.totp !== 'string' || !/^\d{6}$/.test(body.totp)) { sendJson(response, 400, { error: 'Enter the current six-digit authenticator code.' }); return; }
        const setupKey = tokenDigest(body.setupToken);
        const pending = pendingLocalOwners.get(setupKey);
        if (!pending || pending.expiresAt <= Date.now()) { pendingLocalOwners.delete(setupKey); sendJson(response, 400, { error: 'Setup expired. Begin owner setup again.' }); return; }
        if (!verifyTotp(pending.totpSecret, body.totp)) {
          pending.attempts += 1;
          if (pending.attempts >= 5) pendingLocalOwners.delete(setupKey);
          sendJson(response, 400, { error: pending.attempts >= 5 ? 'Setup was closed after repeated invalid codes. Begin again.' : 'Authenticator code does not match. Check the secret and device clock.' }); return;
        }
        const owner = await db.transaction(async (tx) => {
          await tx.execute(drizzleSql`select pg_advisory_xact_lock(8073440021)`);
          const [{ value: existingAdmins }] = await tx.select({ value: count() }).from(adminUsers);
          if (existingAdmins > 0) throw new Error('Initial setup already completed.');
          const [created] = await tx.insert(adminUsers).values({ id: randomUUID(), email: pending.email, passwordSalt: pending.passwordSalt, passwordHash: pending.passwordHash, totpSecretEncrypted: encryptTotpSecret(pending.totpSecret), role: 'OWNER' }).returning();
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: created.id, action: 'admin.owner.bootstrapped', targetId: created.id });
          return created;
        });
        pendingLocalOwners.delete(setupKey);
        const token = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
        await db.insert(adminSessions).values({ tokenHash: tokenDigest(token), userId: owner.id, expiresAt });
        sendJson(response, 201, { token, user: safeAdmin(owner), expiresAt: expiresAt.toISOString() });
      } catch (error) {
        if (error instanceof Error && error.message === 'Initial setup already completed.') { sendJson(response, 409, { error: 'An owner already exists. Initial setup is permanently closed.' }); return; }
        sendJson(response, 503, { error: 'Owner setup failed. Retry with a fresh setup session.' });
      }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/session') {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many sign-in attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string' || typeof body.totp !== 'string' || body.email.length > 254 || body.password.length > 256 || body.totp.length > 32) {
          sendJson(response, 400, { error: 'Email, password and current authenticator code are required.' }); return;
        }
        const session = await authenticateAdmin(body.email, body.password, body.totp);
        if (!session) { sendJson(response, 401, { error: 'Sign-in failed. Check your details or contact the account owner.' }); return; }
        await writeAudit(session.user.id, 'admin.session.created', session.user.id, { role: session.user.role });
        sendJson(response, 200, { token: session.token, user: session.user, expiresAt: session.expiresAt.toISOString() });
      } catch { sendJson(response, 503, { error: 'Admin sign-in is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/password-reset/request') {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many recovery attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || body.email.length > 254) { sendJson(response, 400, { error: 'Provide the administrator account email address.' }); return; }
        const email = normalizeEmail(body.email);
        const [admin] = await db.select().from(adminUsers).where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true))).limit(1);
        let previewUrl: string | undefined;
        if (admin) {
          const issued = await issueAdminPasswordReset(admin.id);
          try {
            const delivery = await sendAdminPasswordReset(email, issued.token);
            previewUrl = delivery.previewUrl;
          } catch {
            console.error('admin_password_reset_delivery_failed');
          }
        }
        sendJson(response, 202, { message: 'If an active administrator account exists for that address, reset instructions have been sent.', ...(previewUrl ? { previewUrl } : {}) });
      } catch { sendJson(response, 202, { message: 'If an active administrator account exists for that address, reset instructions have been sent.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/password-reset/complete') {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many recovery attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.token !== 'string' || typeof body.password !== 'string' || !validatePassword(body.password)) { sendJson(response, 400, { error: 'Use a valid reset link and a password of at least 15 characters with upper/lowercase letters and a number.' }); return; }
        if (!await resetAdminPassword(body.token, body.password)) { sendJson(response, 400, { error: 'This reset link is invalid, expired, or already used.' }); return; }
        sendJson(response, 200, { message: 'Password updated. Your authenticator is still required at sign-in.' });
      } catch { sendJson(response, 503, { error: 'Administrator password reset is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/access-recovery/request') {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many recovery attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || body.email.length > 254) { sendJson(response, 400, { error: 'Provide the administrator account email address.' }); return; }
        const email = normalizeEmail(body.email);
        const [admin] = await db.select().from(adminUsers).where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true))).limit(1);
        let previewUrl: string | undefined;
        if (admin) {
          const issued = await issueAdminPasswordReset(admin.id);
          try {
            const delivery = await sendAdminAccessRecovery(email, issued.token);
            previewUrl = delivery.previewUrl;
          } catch {
            console.error('admin_access_recovery_delivery_failed');
          }
        }
        sendJson(response, 202, { message: 'If an active administrator account exists for that address, recovery instructions have been sent.', ...(previewUrl ? { previewUrl } : {}) });
      } catch { sendJson(response, 202, { message: 'If an active administrator account exists for that address, recovery instructions have been sent.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/access-recovery/prepare') {
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.token !== 'string') { sendJson(response, 400, { error: 'A valid recovery token is required.' }); return; }
        const enrollment = await prepareAdminAccessRecovery(body.token);
        if (!enrollment) { sendJson(response, 400, { error: 'This recovery link is invalid, expired, or already used.' }); return; }
        sendJson(response, 200, { ...enrollment, expiresInSeconds: 1800 });
      } catch { sendJson(response, 503, { error: 'Administrator recovery is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/access-recovery/complete') {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many recovery attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.token !== 'string' || typeof body.password !== 'string' || typeof body.totp !== 'string' || !validatePassword(body.password) || !/^\d{6}$/.test(body.totp)) {
          sendJson(response, 400, { error: 'Provide a valid recovery link, a strong password, and the current six-digit code from your new authenticator.' }); return;
        }
        if (!await completeAdminAccessRecovery(body.token, body.password, body.totp)) { sendJson(response, 400, { error: 'This recovery link or authenticator code is invalid, expired, or already used.' }); return; }
        sendJson(response, 200, { message: 'Access recovered. Sign in using your new password and authenticator code.' });
      } catch { sendJson(response, 503, { error: 'Administrator recovery is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/session') {
      const user = await authorize(request, response, 'catalog:read');
      if (!user) return;
      sendJson(response, 200, { user });
      return;
    }
    if (request.method === 'DELETE' && url.pathname === '/api/admin/session') {
      const token = bearer(request);
      const user = await getAdminSession(token);
      if (user) await writeAudit(user.id, 'admin.session.revoked', user.id);
      await revokeAdminSession(token);
      sendJson(response, 200, { status: 'signed_out' });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/products') {
      if (!await authorize(request, response, 'catalog:read')) return;
      const rows = await db.select({ product: products, stock: productInventory }).from(products).leftJoin(productInventory, eq(productInventory.productId, products.id)).orderBy(products.id).limit(500);
      sendJson(response, 200, { items: rows.map(({ product, stock }) => ({ ...product, onHand: stock?.onHand ?? 0, reserved: stock?.reserved ?? 0 })), total: rows.length });
      return;
    }
    const inventoryPath = url.pathname.match(/^\/api\/admin\/inventory\/([^/]+)$/);
    if (request.method === 'PATCH' && inventoryPath) {
      const actor = await authorize(request, response, 'catalog:write');
      if (!actor) return;
      let productId: string;
      try { productId = decodeURIComponent(inventoryPath[1]); } catch { sendJson(response, 400, { error: 'Invalid product identifier.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || Object.keys(body).length !== 1 || !Number.isSafeInteger(body.onHand) || Number(body.onHand) < 0 || Number(body.onHand) > 1_000_000) { sendJson(response, 400, { error: 'Enter an on-hand stock count from 0 to 1,000,000.' }); return; }
        const updated = await db.transaction(async (tx) => {
          const [stock] = await tx.update(productInventory).set({ onHand: Number(body.onHand), updatedAt: new Date() }).where(and(eq(productInventory.productId, productId), drizzleSql`${productInventory.reserved} <= ${Number(body.onHand)}`)).returning();
          if (!stock) return null;
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'inventory.on_hand_updated', targetId: productId, metadata: { onHand: stock.onHand, reserved: stock.reserved } });
          return stock;
        });
        if (!updated) { sendJson(response, 409, { error: 'Stock was not changed. Check that the product exists and on-hand quantity is not below reserved orders.' }); return; }
        sendJson(response, 200, { inventory: updated });
      } catch { sendJson(response, 503, { error: 'Inventory update is temporarily unavailable.' }); }
      return;
    }
    if ((request.method === 'POST') && (url.pathname === '/api/admin/products/import/preview' || url.pathname === '/api/admin/products/import/commit')) {
      const actor = await authorize(request, response, 'catalog:write');
      if (!actor) return;
      try {
        const body = await readJson(request, 70 * 1024);
        if (!isRecord(body) || typeof body.csv !== 'string') { sendJson(response, 400, { error: 'Provide the CSV text to validate.' }); return; }
        const preview = await previewProductCsv(body.csv);
        if (url.pathname.endsWith('/preview')) {
          sendJson(response, 200, { valid: preview.valid, itemCount: preview.items.length, rows: preview.rows });
          return;
        }
        if (body.confirmImport !== true) { sendJson(response, 400, { error: 'Confirm the validated import explicitly.' }); return; }
        if (!preview.valid || preview.items.length === 0) { sendJson(response, 409, { error: 'Resolve all CSV preview errors before importing.', rows: preview.rows }); return; }
        const created = await db.transaction(async (tx) => {
          const rows = await tx.insert(products).values(preview.items.map((item) => ({ ...item, isPublished: false, contentStatus: 'sample' as const }))).returning({ id: products.id });
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'product.csv_imported', targetId: null, metadata: { count: rows.length, ids: rows.map((row) => row.id) } });
          return rows;
        });
        sendJson(response, 201, { imported: created.length, ids: created.map((row) => row.id), status: 'drafts_created' });
      } catch { sendJson(response, 503, { error: 'CSV import is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/products') {
      const actor = await authorize(request, response, 'catalog:write');
      if (!actor) return;
      try {
        const input = validateProductInput(await readJson(request));
        if (!input || input.isPublished) { sendJson(response, 400, { error: 'Provide valid product fields. New products must start as drafts.' }); return; }
        const created = await db.transaction(async (tx) => {
          const [row] = await tx.insert(products).values({ ...input, isPublished: false, contentStatus: 'sample' }).returning();
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'product.created', targetId: row.id, metadata: { contentStatus: row.contentStatus } });
          return row;
        });
        sendJson(response, 201, { product: created });
      } catch { sendJson(response, 503, { error: 'Product administration is temporarily unavailable.' }); }
      return;
    }
    const adminProductPath = url.pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
    if (adminProductPath && ['PATCH', 'DELETE'].includes(request.method ?? '')) {
      const actor = await authorize(request, response, 'catalog:write');
      if (!actor) return;
      const id = decodeURIComponent(adminProductPath[1]);
      const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!current) { sendJson(response, 404, { error: 'Product not found.' }); return; }
      if (request.method === 'DELETE') {
        await db.transaction(async (tx) => {
          await tx.update(products).set({ isPublished: false, updatedAt: new Date() }).where(eq(products.id, id));
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'product.unpublished', targetId: id });
        });
        sendJson(response, 200, { status: 'unpublished' });
        return;
      }
      try {
        const patch = await readJson(request);
        if (!isRecord(patch) || Object.keys(patch).length === 0 || Object.keys(patch).some((key) => !['slug', 'name', 'category', 'pricePaise', 'material', 'description', 'image', 'size', 'lead', 'gallery', 'isPublished'].includes(key))) {
          sendJson(response, 400, { error: 'Provide one or more supported product fields.' }); return;
        }
        if (patch.isPublished === true && !hasPermission(actor.role, 'catalog:publish')) { sendJson(response, 403, { error: 'Only an OWNER can publish products.' }); return; }
        if (patch.isPublished === true && current.contentStatus !== 'merchant_approved') { sendJson(response, 409, { error: 'Product publication requires merchant approval.' }); return; }
        const merged = validateProductInput({
          id: current.id, slug: patch.slug ?? current.slug, name: patch.name ?? current.name,
          category: patch.category ?? current.category, pricePaise: patch.pricePaise ?? current.pricePaise,
          material: patch.material ?? current.material, description: patch.description ?? current.description,
          image: patch.image ?? current.image, size: patch.size ?? current.size, lead: patch.lead ?? current.lead,
          gallery: patch.gallery ?? current.gallery, isPublished: patch.isPublished ?? current.isPublished,
        });
        if (!merged) { sendJson(response, 400, { error: 'Product fields are invalid.' }); return; }
        const contentChanged = Object.keys(patch).some((key) => key !== 'isPublished');
        const demoteSampleToDraft = current.contentStatus === 'sample' && contentChanged;
        const updated = await db.transaction(async (tx) => {
          const [row] = await tx.update(products).set({
            slug: merged.slug, name: merged.name, category: merged.category, pricePaise: merged.pricePaise,
            material: merged.material, description: merged.description, image: merged.image,
            size: merged.size, lead: merged.lead, gallery: merged.gallery,
            isPublished: demoteSampleToDraft ? false : patch.isPublished === undefined ? current.isPublished : patch.isPublished as boolean,
            updatedAt: new Date(),
          }).where(eq(products.id, id)).returning();
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'product.updated', targetId: id, metadata: { fields: Object.keys(patch), unpublishedForReview: demoteSampleToDraft } });
          return row;
        });
        sendJson(response, 200, { product: updated });
      } catch { sendJson(response, 503, { error: 'Product administration is temporarily unavailable.' }); }
      return;
    }
    const approvalPath = url.pathname.match(/^\/api\/admin\/products\/([^/]+)\/approve$/);
    if (request.method === 'POST' && approvalPath) {
      const actor = await authorize(request, response, 'catalog:publish');
      if (!actor) return;
      try {
        const body = await readJson(request);
        if (!isRecord(body) || body.merchantApprovalConfirmed !== true) { sendJson(response, 400, { error: 'Explicit merchant approval confirmation is required.' }); return; }
        const id = decodeURIComponent(approvalPath[1]);
        const approved = await db.transaction(async (tx) => {
          const [row] = await tx.update(products).set({ contentStatus: 'merchant_approved', updatedAt: new Date() }).where(eq(products.id, id)).returning();
          if (!row) return null;
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'product.merchant_approved', targetId: id, metadata: { confirmation: true } });
          return row;
        });
        if (!approved) { sendJson(response, 404, { error: 'Product not found.' }); return; }
        sendJson(response, 200, { product: approved });
      } catch { sendJson(response, 503, { error: 'Product approval is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/audit') {
      if (!await authorize(request, response, 'audit:read')) return;
      const rows = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(100);
      sendJson(response, 200, { items: rows, retentionNotice: 'No expiry policy is configured; audit records are retained indefinitely pending merchant approval of retention.' });
      return;
    }
    const invitationAcceptPath = url.pathname.match(/^\/api\/admin\/invitations\/([A-Za-z0-9_-]{40,64})$/);
    if (request.method === 'GET' && invitationAcceptPath) {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many invitation attempts. Try again in one minute.' }); return; }
      try {
        const invitation = await inspectAdminInvitation(invitationAcceptPath[1]);
        if (!invitation) { sendJson(response, 404, { error: 'This invitation is invalid or expired.' }); return; }
        sendJson(response, 200, invitation);
      } catch { sendJson(response, 503, { error: 'Invitation service is temporarily unavailable.' }); }
      return;
    }
    const invitationPreparePath = url.pathname.match(/^\/api\/admin\/invitations\/([A-Za-z0-9_-]{40,64})\/prepare$/);
    if (request.method === 'POST' && invitationPreparePath) {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many invitation attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.password !== 'string') { sendJson(response, 400, { error: 'Choose a strong account password.' }); return; }
        sendJson(response, 200, await prepareAdminInvitation(invitationPreparePath[1], body.password));
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const status = message.includes('password') ? 400 : message.includes('already exists') ? 409 : message.includes('invalid or expired') ? 410 : 503;
        sendJson(response, status, { error: message || 'Invitation setup is temporarily unavailable.' });
      }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/invitations/complete') {
      if (await loginRateLimited(request)) { sendJson(response, 429, { error: 'Too many invitation attempts. Try again in one minute.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.setupToken !== 'string' || typeof body.totp !== 'string') { sendJson(response, 400, { error: 'Enter the current six-digit authenticator code.' }); return; }
        sendJson(response, 201, await completeAdminInvitation(body.setupToken, body.totp));
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const status = message.includes('six-digit') || message.includes('does not match') ? 400 : message.includes('expired') || message.includes('already been used') ? 410 : message.includes('already exists') ? 409 : 503;
        sendJson(response, status, { error: message || 'Invitation setup is temporarily unavailable.' });
      }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/invitations') {
      if (!await authorize(request, response, 'staff:manage')) return;
      try { sendJson(response, 200, { items: await listAdminInvitations() }); }
      catch { sendJson(response, 503, { error: 'Staff invitations are temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/invitations') {
      const actor = await authorize(request, response, 'staff:manage');
      if (!actor) return;
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || !isAdminRole(body.role) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254 || (body.role === 'OWNER' && body.ownerCreationConfirmed !== true)) {
          sendJson(response, 400, { error: 'Provide a valid email, role and explicit confirmation when inviting another OWNER.' }); return;
        }
        const invitation = await createAdminInvitation(actor.id, body.email, body.role);
        let delivery: Awaited<ReturnType<typeof sendAdminInvitation>>;
        try { delivery = await sendAdminInvitation(invitation.email, invitation.role, invitation.token); }
        catch (error) {
          await cancelAdminInvitation(actor.id, invitation.id);
          if (error instanceof Error && error.message.includes('not configured')) { sendJson(response, 503, { error: 'Staff invitation email is not configured. Configure Resend or enable the local development invitation links.' }); return; }
          sendJson(response, 503, { error: 'Invitation email delivery failed. The invitation was cancelled; try again or check the email provider.' }); return;
        }
        await writeAudit(actor.id, 'staff.invitation_delivered', invitation.email, { role: invitation.role, delivered: delivery.delivered });
        sendJson(response, 201, { invitation: { id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt }, delivered: delivery.delivered, previewUrl: delivery.previewUrl });
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) { sendJson(response, 409, { error: error.message }); return; }
        sendJson(response, 503, { error: 'Staff invitation could not be created.' });
      }
      return;
    }
    const cancelInvitationPath = url.pathname.match(/^\/api\/admin\/invitations\/([a-f0-9-]{36})$/i);
    if (request.method === 'DELETE' && cancelInvitationPath) {
      const actor = await authorize(request, response, 'staff:manage');
      if (!actor) return;
      try {
        const cancelled = await cancelAdminInvitation(actor.id, cancelInvitationPath[1]);
        if (!cancelled) { sendJson(response, 404, { error: 'Active invitation not found.' }); return; }
        sendJson(response, 200, { status: 'cancelled' });
      } catch { sendJson(response, 503, { error: 'Invitation could not be cancelled.' }); }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/staff') {
      const actor = await authorize(request, response, 'staff:manage');
      if (!actor) return;
      try {
        const body = await readJson(request);
        if (!isRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string' || typeof body.totpSecret !== 'string' || typeof body.totpCode !== 'string' || !['OWNER', 'CATALOG_MANAGER', 'ORDER_MANAGER', 'SUPPORT', 'ANALYST'].includes(String(body.role)) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254 || !validatePassword(body.password) || (body.role === 'OWNER' && body.ownerCreationConfirmed !== true)) {
          sendJson(response, 400, { error: 'Valid email, strong password, base32 MFA secret, current MFA code and explicit owner confirmation are required.' }); return;
        }
        if (!decodeBase32(body.totpSecret) || !/^\d{6}$/.test(body.totpCode) || !verifyTotp(body.totpSecret, body.totpCode)) { sendJson(response, 400, { error: 'MFA secret and current code do not match.' }); return; }
        const password = await hashPassword(body.password);
        const newUser = await db.transaction(async (tx) => {
          const [row] = await tx.insert(adminUsers).values({ id: randomUUID(), email: normalizeEmail(body.email as string), passwordSalt: password.salt, passwordHash: password.hash, totpSecretEncrypted: encryptTotpSecret((body.totpSecret as string).replace(/=+$/, '').toUpperCase()), role: body.role as 'CATALOG_MANAGER' | 'ORDER_MANAGER' | 'SUPPORT' | 'ANALYST' }).returning();
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'staff.created', targetId: row.id, metadata: { role: row.role } });
          return row;
        });
        sendJson(response, 201, { user: { id: newUser.id, email: newUser.email, role: newUser.role } });
      } catch { sendJson(response, 503, { error: 'Staff administration is temporarily unavailable.' }); }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/products') {
      const parsed = parseQuery(url);
      if ('error' in parsed) {
        sendJson(response, 400, { error: parsed.error });
        return;
      }
      try {
        const page = await listProducts(parsed.query);
        sendJson(response, 200, page);
      } catch {
        sendJson(response, 503, { error: 'Product data is temporarily unavailable.' });
      }
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/staff') {
      if (!await authorize(request, response, 'staff:manage')) return;
      const rows = await db.select({ id: adminUsers.id, email: adminUsers.email, role: adminUsers.role, isActive: adminUsers.isActive, createdAt: adminUsers.createdAt }).from(adminUsers).orderBy(adminUsers.email).limit(500);
      sendJson(response, 200, { items: rows, total: rows.length });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/orders') {
      if (!await authorize(request, response, 'orders:read')) return;
      try {
        const rows = await listStaffOrders(200);
        const items = [];
        for (const row of rows) items.push({ ...row.order, customer: { fullName: row.customerName, email: row.customerEmail }, lines: await db.select().from(commerceOrderLines).where(eq(commerceOrderLines.orderId, row.order.id)) });
        sendJson(response, 200, { items, total: items.length });
      } catch { sendJson(response, 503, { error: 'Order data is temporarily unavailable.' }); }
      return;
    }
    const orderPath = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
    if (request.method === 'PATCH' && orderPath) {
      const actor = await authorize(request, response, 'orders:manage');
      if (!actor) return;
      let orderId: string;
      try { orderId = decodeURIComponent(orderPath[1]); } catch { sendJson(response, 400, { error: 'Invalid order identifier.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || body.action !== 'cancel') { sendJson(response, 400, { error: 'Only COD cancellation is available in this phase.' }); return; }
        const cancelled = await cancelCodOrder(orderId, actor.id);
        sendJson(response, 200, { order: cancelled });
      } catch (error) {
        if (error instanceof CommerceError) { sendJson(response, error.status, { error: error.message }); return; }
        sendJson(response, 503, { error: 'Order update is temporarily unavailable.' });
      }
      return;
    }
    const staffPath = url.pathname.match(/^\/api\/admin\/staff\/([^/]+)$/);
    if (request.method === 'PATCH' && staffPath) {
      const actor = await authorize(request, response, 'staff:manage');
      if (!actor) return;
      const id = decodeURIComponent(staffPath[1]);
      if (id === actor.id) { sendJson(response, 409, { error: 'Owners cannot change their own role or active state.' }); return; }
      try {
        const body = await readJson(request);
        if (!isRecord(body) || Object.keys(body).some((key) => !['isActive', 'role', 'ownerPromotionConfirmed'].includes(key)) || (body.isActive !== undefined && typeof body.isActive !== 'boolean') || (body.role !== undefined && !['OWNER', 'CATALOG_MANAGER', 'ORDER_MANAGER', 'SUPPORT', 'ANALYST'].includes(String(body.role))) || (body.isActive === undefined && body.role === undefined) || (body.role === 'OWNER' && body.ownerPromotionConfirmed !== true)) {
          sendJson(response, 400, { error: 'Provide one valid role or active-state change.' }); return;
        }
        const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
        if (!target) { sendJson(response, 404, { error: 'Staff account not found.' }); return; }
        const nextRole = (body.role as typeof target.role | undefined) ?? target.role;
        const nextActive = (body.isActive as boolean | undefined) ?? target.isActive;
        if (target.role === 'OWNER' && (!nextActive || nextRole !== 'OWNER')) {
          const [{ value: activeOwners }] = await db.select({ value: count() }).from(adminUsers).where(and(eq(adminUsers.role, 'OWNER'), eq(adminUsers.isActive, true)));
          if (activeOwners <= 1) { sendJson(response, 409, { error: 'At least one active OWNER must remain.' }); return; }
        }
        await db.transaction(async (tx) => {
          await tx.update(adminUsers).set({ role: nextRole, isActive: nextActive, updatedAt: new Date() }).where(eq(adminUsers.id, id));
          if (!nextActive) await tx.delete(adminSessions).where(eq(adminSessions.userId, id));
          await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: actor.id, action: 'staff.updated', targetId: id, metadata: { role: nextRole, isActive: nextActive } });
        });
        sendJson(response, 200, { user: { id: target.id, email: target.email, role: nextRole, isActive: nextActive } });
      } catch { sendJson(response, 503, { error: 'Staff administration is temporarily unavailable.' }); }
      return;
    }
    const productPath = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (request.method === 'GET' && productPath) {
      let idOrSlug: string;
      try {
        idOrSlug = decodeURIComponent(productPath[1]);
      } catch {
        sendJson(response, 400, { error: 'Invalid product identifier.' });
        return;
      }
      if (idOrSlug.length > 160) {
        sendJson(response, 400, { error: 'Product identifier is too long.' });
        return;
      }
      try {
        const product = await getPublishedProduct(idOrSlug);
        if (!product) {
          sendJson(response, 404, { error: 'Product not found.' });
          return;
        }
        sendJson(response, 200, product);
      } catch {
        sendJson(response, 503, { error: 'Product data is temporarily unavailable.' });
      }
      return;
    }
    sendJson(response, 404, { error: 'Route not found.' });
    })().catch(() => {
      if (!response.headersSent) sendJson(response, 503, { error: 'Service is temporarily unavailable.' });
      else response.destroy();
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createCommerceServer();
  const { port: listenPort, host } = getBackendRuntimeConfig();
  const reservationSweep = setInterval(() => { void expireCodReservations().catch(() => process.stderr.write('COD reservation expiry sweep failed.\n')); }, 60_000);
  reservationSweep.unref();
  server.listen(listenPort, host, () => {
    process.stdout.write(`Forma TypeScript commerce API listening on ${host}:${listenPort}\n`);
  });

  function shutdown(signal: string) {
    clearInterval(reservationSweep);
    server.close(() => {
      void sql.end().finally(() => {
        process.stdout.write(`Commerce API closed after ${signal}.\n`);
        process.exitCode = 0;
      });
    });
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}
