import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { db, sql } from '../db/connection.ts';
import { createCommerceServer } from '../server.ts';
import { cancelCodOrder, createDeliveryQuote, CommerceError, expireCodReservations, placeCodOrder, readCart, resolveCart, setCartLine } from './service.ts';
import { commerceCartLines, commerceCarts, commerceOrderLines, commerceOrders, commerceQuotes, commerceReservations, customers, productInventory, products } from '../db/schema.ts';
import { eq, inArray } from 'drizzle-orm';

const server = createCommerceServer();
let baseUrl = '';
before(async () => {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('Commerce test server did not bind.'));
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await sql.end();
});

test('commerce endpoints require an opaque cart and verified customer for quotes, orders and scoped administration', async () => {
  const missingCart = await fetch(`${baseUrl}/api/commerce/cart`);
  assert.equal(missingCart.status, 400);
  const guestToken = randomBytes(32).toString('base64url');
  const cart = await fetch(`${baseUrl}/api/commerce/cart`, { headers: { 'X-Forma-Guest-Cart': guestToken } });
  assert.equal(cart.status, 200);
  assert.equal((await cart.json() as { cart: { lines: unknown[] } }).cart.lines.length, 0);
  const guestHeaders = { 'X-Forma-Guest-Cart': guestToken, 'Content-Type': 'application/json' };
  assert.equal((await fetch(`${baseUrl}/api/commerce/quotes`, { method: 'POST', headers: guestHeaders, body: JSON.stringify({ postcode: '560001' }) })).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/commerce/orders`, { method: 'GET', headers: { 'X-Forma-Guest-Cart': guestToken } })).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/admin/orders`)).status, 401);
});

test('persistent guest cart merges into customer cart; COD snapshot is authoritative, idempotent and stock-reserving', async () => {
  const customerId = randomUUID();
  const productId = `phase5-${randomUUID()}`;
  const guestToken = randomBytes(32).toString('base64url');
  const prior = { pins: process.env.DELIVERY_SERVICEABLE_PIN_CODES, fee: process.env.DELIVERY_FEE_PAISE, cod: process.env.COD_ENABLED };
  process.env.DELIVERY_SERVICEABLE_PIN_CODES = '560001';
  process.env.DELIVERY_FEE_PAISE = '25000';
  process.env.COD_ENABLED = 'true';
  let guestCartId: string | undefined;
  let customerCartId: string | undefined;
  let quoteId: string | undefined;
  let orderId: string | undefined;
  try {
    await db.insert(customers).values({ id: customerId, email: `${customerId}@phase5.example.test`, fullName: 'Phase Five Customer', emailVerifiedAt: new Date() });
    await db.insert(products).values({ id: productId, slug: productId, name: 'Approved Test Chair', category: 'Seating', pricePaise: 123_456, material: 'Test wood', description: 'Fixture only', image: 'test/chair.jpg', size: 'Test', lead: 'Test', gallery: ['test/chair.jpg'], isPublished: true, contentStatus: 'merchant_approved' });
    await db.update(productInventory).set({ onHand: 4, reserved: 0 }).where(eq(productInventory.productId, productId));

    const guestCart = await resolveCart({ guestToken });
    guestCartId = guestCart.id;
    await setCartLine(guestCart.id, productId, 2);
    await assert.rejects(setCartLine(guestCart.id, productId, 100), (error: unknown) => error instanceof CommerceError && error.status === 400);
    const cart = await resolveCart({ guestToken, customer: { id: customerId, emailVerified: true } });
    customerCartId = cart.id;
    assert.equal(cart.customerId, customerId);
    const merged = await readCart(cart.id);
    assert.equal(merged.lines.length, 1);
    assert.equal(merged.lines[0].quantity, 2);
    assert.equal(merged.subtotalPaise, 246_912);

    const quote = await createDeliveryQuote(cart.id, { id: customerId, emailVerified: true }, '560001');
    quoteId = quote.id;
    assert.equal(quote.subtotalPaise, 246_912);
    assert.equal(quote.deliveryFeePaise, 25_000);
    assert.equal(quote.totalPaise, 271_912);
    const address = { fullName: 'Phase Five Customer', phone: '+919876543210', addressLine1: '10 Test Road', city: 'Bengaluru', state: 'Karnataka', postcode: '560001' };
    const key = randomBytes(24).toString('base64url');
    await assert.rejects(placeCodOrder(cart.id, { id: customerId, emailVerified: true }, quote.id, address, false, key), (error: unknown) => error instanceof CommerceError && error.status === 400);
    const first = await placeCodOrder(cart.id, { id: customerId, emailVerified: true }, quote.id, address, true, key);
    orderId = first.order.id;
    assert.equal(first.order.status, 'placed');
    assert.equal(first.order.paymentMethod, 'cod');
    assert.equal(first.order.paymentStatus, 'amount_due');
    assert.equal(first.order.fulfillmentConsentVersion, 'delivery-fulfillment-v1');
    assert.ok(first.order.fulfillmentConsentAt instanceof Date);
    assert.equal(first.order.totalPaise, 271_912);
    assert.equal(first.lines[0].skuSnapshot, productId);
    const inventoryAfterOrder = (await db.select().from(productInventory).where(eq(productInventory.productId, productId)))[0];
    assert.equal(inventoryAfterOrder.onHand, 4);
    assert.equal(inventoryAfterOrder.reserved, 2);

    const replay = await placeCodOrder(cart.id, { id: customerId, emailVerified: true }, quote.id, address, true, key);
    assert.equal(replay.order.id, first.order.id);
    assert.equal(replay.replayed, true);
    assert.equal((await db.select().from(commerceOrders).where(eq(commerceOrders.customerId, customerId))).length, 1);

    const cancelled = await cancelCodOrder(first.order.id);
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.paymentStatus, 'void');
    assert.equal((await db.select().from(productInventory).where(eq(productInventory.productId, productId)))[0].reserved, 0);

    await setCartLine(cart.id, productId, 1);
    await setCartLine(cart.id, productId, 0);
    assert.equal((await readCart(cart.id)).lines.length, 0);
    await setCartLine(cart.id, productId, 1);
    await db.update(products).set({ contentStatus: 'sample' }).where(eq(products.id, productId));
    await assert.rejects(createDeliveryQuote(cart.id, { id: customerId, emailVerified: true }, '560001'), (error: unknown) => error instanceof CommerceError && error.status === 409);
    await db.update(products).set({ contentStatus: 'merchant_approved' }).where(eq(products.id, productId));
    await assert.rejects(createDeliveryQuote(cart.id, { id: customerId, emailVerified: true }, '110001'), (error: unknown) => error instanceof CommerceError && error.status === 422);
  } finally {
    if (orderId) {
      await db.delete(commerceOrderLines).where(eq(commerceOrderLines.orderId, orderId));
      await db.delete(commerceReservations).where(eq(commerceReservations.orderId, orderId));
      await db.delete(commerceOrders).where(eq(commerceOrders.id, orderId));
    }
    if (quoteId) await db.delete(commerceQuotes).where(eq(commerceQuotes.id, quoteId));
    if (customerCartId) await db.delete(commerceCartLines).where(eq(commerceCartLines.cartId, customerCartId));
    if (guestCartId) await db.delete(commerceCarts).where(eq(commerceCarts.id, guestCartId));
    if (customerCartId) await db.delete(commerceCarts).where(eq(commerceCarts.id, customerCartId));
    await db.delete(productInventory).where(eq(productInventory.productId, productId));
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(customers).where(eq(customers.id, customerId));
    if (prior.pins === undefined) delete process.env.DELIVERY_SERVICEABLE_PIN_CODES; else process.env.DELIVERY_SERVICEABLE_PIN_CODES = prior.pins;
    if (prior.fee === undefined) delete process.env.DELIVERY_FEE_PAISE; else process.env.DELIVERY_FEE_PAISE = prior.fee;
    if (prior.cod === undefined) delete process.env.COD_ENABLED; else process.env.COD_ENABLED = prior.cod;
  }
});

test('concurrent COD checkouts use conditional inventory reservation and never oversell', async () => {
  const customerIds = [randomUUID(), randomUUID()];
  const productId = `phase5-race-${randomUUID()}`;
  const guestTokens = customerIds.map(() => randomBytes(32).toString('base64url'));
  const previous = { pins: process.env.DELIVERY_SERVICEABLE_PIN_CODES, fee: process.env.DELIVERY_FEE_PAISE, cod: process.env.COD_ENABLED };
  process.env.DELIVERY_SERVICEABLE_PIN_CODES = '560001'; process.env.DELIVERY_FEE_PAISE = '0'; process.env.COD_ENABLED = 'true';
  try {
    for (const [index, id] of customerIds.entries()) await db.insert(customers).values({ id, email: `${id}@phase5.example.test`, fullName: `Race Customer ${index + 1}`, emailVerifiedAt: new Date() });
    await db.insert(products).values({ id: productId, slug: productId, name: 'Single Stock Test Piece', category: 'Seating', pricePaise: 99_999, material: 'Fixture', description: 'Race test', image: 'test/race.jpg', size: 'Test', lead: 'Test', gallery: ['test/race.jpg'], isPublished: true, contentStatus: 'merchant_approved' });
    await db.update(productInventory).set({ onHand: 1, reserved: 0 }).where(eq(productInventory.productId, productId));
    const checkouts = [];
    for (const [index, customerId] of customerIds.entries()) {
      const cart = await resolveCart({ guestToken: guestTokens[index], customer: { id: customerId, emailVerified: true } });
      await setCartLine(cart.id, productId, 1);
      const quote = await createDeliveryQuote(cart.id, { id: customerId, emailVerified: true }, '560001');
      checkouts.push({ cartId: cart.id, customerId, quoteId: quote.id });
    }
    const attempts = await Promise.allSettled(checkouts.map((checkout) => placeCodOrder(checkout.cartId, { id: checkout.customerId, emailVerified: true }, checkout.quoteId, { fullName: 'Race Customer', phone: '+919876543210', addressLine1: '10 Test Road', city: 'Bengaluru', state: 'Karnataka', postcode: '560001' }, true, randomBytes(24).toString('base64url'))));
    const placed = attempts.filter((attempt): attempt is PromiseFulfilledResult<Awaited<ReturnType<typeof placeCodOrder>>> => attempt.status === 'fulfilled');
    assert.equal(placed.length, 1);
    const stock = (await db.select().from(productInventory).where(eq(productInventory.productId, productId)))[0];
    assert.equal(stock.onHand, 1);
    assert.equal(stock.reserved, 1);
    await cancelCodOrder(placed[0].value.order.id);
    assert.equal((await db.select().from(productInventory).where(eq(productInventory.productId, productId)))[0].reserved, 0);
  } finally {
    const orders = await db.select({ id: commerceOrders.id }).from(commerceOrders).where(inArray(commerceOrders.customerId, customerIds));
    const orderIds = orders.map((order) => order.id);
    if (orderIds.length) {
      await db.delete(commerceOrderLines).where(inArray(commerceOrderLines.orderId, orderIds));
      await db.delete(commerceReservations).where(inArray(commerceReservations.orderId, orderIds));
      await db.delete(commerceOrders).where(inArray(commerceOrders.id, orderIds));
    }
    await db.delete(commerceQuotes).where(inArray(commerceQuotes.customerId, customerIds));
    const carts = await db.select({ id: commerceCarts.id }).from(commerceCarts).where(inArray(commerceCarts.customerId, customerIds));
    const cartIds = carts.map((cart) => cart.id);
    if (cartIds.length) { await db.delete(commerceCartLines).where(inArray(commerceCartLines.cartId, cartIds)); await db.delete(commerceCarts).where(inArray(commerceCarts.id, cartIds)); }
    await db.delete(productInventory).where(eq(productInventory.productId, productId));
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(customers).where(inArray(customers.id, customerIds));
    if (previous.pins === undefined) delete process.env.DELIVERY_SERVICEABLE_PIN_CODES; else process.env.DELIVERY_SERVICEABLE_PIN_CODES = previous.pins;
    if (previous.fee === undefined) delete process.env.DELIVERY_FEE_PAISE; else process.env.DELIVERY_FEE_PAISE = previous.fee;
    if (previous.cod === undefined) delete process.env.COD_ENABLED; else process.env.COD_ENABLED = previous.cod;
  }
});

test('expired unpaid COD reservations release stock and void the order', async () => {
  const customerId = randomUUID();
  const productId = `phase5-expiry-${randomUUID()}`;
  const guestToken = randomBytes(32).toString('base64url');
  const previous = { pins: process.env.DELIVERY_SERVICEABLE_PIN_CODES, fee: process.env.DELIVERY_FEE_PAISE, cod: process.env.COD_ENABLED };
  process.env.DELIVERY_SERVICEABLE_PIN_CODES = '560001'; process.env.DELIVERY_FEE_PAISE = '0'; process.env.COD_ENABLED = 'true';
  try {
    await db.insert(customers).values({ id: customerId, email: `${customerId}@phase5.example.test`, fullName: 'Expiry Customer', emailVerifiedAt: new Date() });
    await db.insert(products).values({ id: productId, slug: productId, name: 'Reservation Expiry Test Piece', category: 'Seating', pricePaise: 77_777, material: 'Fixture', description: 'Expiry test', image: 'test/expiry.jpg', size: 'Test', lead: 'Test', gallery: ['test/expiry.jpg'], isPublished: true, contentStatus: 'merchant_approved' });
    await db.update(productInventory).set({ onHand: 1, reserved: 0 }).where(eq(productInventory.productId, productId));
    const cart = await resolveCart({ guestToken, customer: { id: customerId, emailVerified: true } });
    await setCartLine(cart.id, productId, 1);
    const quote = await createDeliveryQuote(cart.id, { id: customerId, emailVerified: true }, '560001');
    const placed = await placeCodOrder(cart.id, { id: customerId, emailVerified: true }, quote.id, { fullName: 'Expiry Customer', phone: '+919876543210', addressLine1: '10 Test Road', city: 'Bengaluru', state: 'Karnataka', postcode: '560001' }, true, randomBytes(24).toString('base64url'));
    await db.update(commerceReservations).set({ expiresAt: new Date(Date.now() - 1_000) }).where(eq(commerceReservations.orderId, placed.order.id));

    assert.equal(await expireCodReservations(), 1);
    const [order] = await db.select().from(commerceOrders).where(eq(commerceOrders.id, placed.order.id));
    const [stock] = await db.select().from(productInventory).where(eq(productInventory.productId, productId));
    const [reservation] = await db.select().from(commerceReservations).where(eq(commerceReservations.orderId, placed.order.id));
    assert.equal(order.status, 'cancelled');
    assert.equal(order.paymentStatus, 'void');
    assert.equal(stock.reserved, 0);
    assert.ok(reservation.releasedAt instanceof Date);
  } finally {
    const orders = await db.select({ id: commerceOrders.id }).from(commerceOrders).where(eq(commerceOrders.customerId, customerId));
    const orderIds = orders.map((order) => order.id);
    if (orderIds.length) {
      await db.delete(commerceOrderLines).where(inArray(commerceOrderLines.orderId, orderIds));
      await db.delete(commerceReservations).where(inArray(commerceReservations.orderId, orderIds));
      await db.delete(commerceOrders).where(inArray(commerceOrders.id, orderIds));
    }
    await db.delete(commerceQuotes).where(eq(commerceQuotes.customerId, customerId));
    const carts = await db.select({ id: commerceCarts.id }).from(commerceCarts).where(eq(commerceCarts.customerId, customerId));
    const cartIds = carts.map((cart) => cart.id);
    if (cartIds.length) { await db.delete(commerceCartLines).where(inArray(commerceCartLines.cartId, cartIds)); await db.delete(commerceCarts).where(inArray(commerceCarts.id, cartIds)); }
    await db.delete(productInventory).where(eq(productInventory.productId, productId));
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(customers).where(eq(customers.id, customerId));
    if (previous.pins === undefined) delete process.env.DELIVERY_SERVICEABLE_PIN_CODES; else process.env.DELIVERY_SERVICEABLE_PIN_CODES = previous.pins;
    if (previous.fee === undefined) delete process.env.DELIVERY_FEE_PAISE; else process.env.DELIVERY_FEE_PAISE = previous.fee;
    if (previous.cod === undefined) delete process.env.COD_ENABLED; else process.env.COD_ENABLED = previous.cod;
  }
});
