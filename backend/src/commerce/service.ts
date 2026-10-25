import { createHash, randomUUID } from 'node:crypto';
import { and, asc, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import { db } from '../db/connection.ts';
import { adminAuditLogs, commerceCartLines, commerceCarts, commerceOrderLines, commerceOrders, commerceQuotes, commerceReservations, customers, productInventory, products } from '../db/schema.ts';
import { tokenDigest } from '../auth/service.ts';

const cartLifetimeMs = 30 * 24 * 60 * 60_000;
const quoteLifetimeMs = 10 * 60_000;
const reservationLifetimeMs = 24 * 60 * 60_000;

export class CommerceError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.name = 'CommerceError'; this.status = status; }
}

export type CommerceActor = { id: string; emailVerified: boolean };
export type ShippingAddress = { fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; postcode: string };

function deliverySettings() {
  const fee = Number(process.env.DELIVERY_FEE_PAISE ?? '0');
  const postcodes = new Set((process.env.DELIVERY_SERVICEABLE_PIN_CODES ?? '').split(',').map((item) => item.trim()).filter((item) => /^\d{6}$/.test(item)));
  return { fee, postcodes, codEnabled: process.env.COD_ENABLED === 'true' };
}

function assertConfiguredFee(fee: number) {
  if (!Number.isSafeInteger(fee) || fee < 0 || fee > 100_000_000) throw new CommerceError(503, 'Delivery pricing is not configured.');
}

export async function resolveCart(input: { guestToken: string; customer?: CommerceActor | null }) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(input.guestToken)) throw new CommerceError(400, 'Cart session is invalid.');
  const guestHash = tokenDigest(input.guestToken);
  const now = new Date();
  return db.transaction(async (tx) => {
    let cart: typeof commerceCarts.$inferSelect | undefined;
    if (input.customer) {
      const [customerCart] = await tx.select().from(commerceCarts).where(eq(commerceCarts.customerId, input.customer.id)).limit(1).for('update');
      const [guestCart] = await tx.select().from(commerceCarts).where(and(eq(commerceCarts.guestTokenHash, guestHash), gt(commerceCarts.expiresAt, now))).limit(1).for('update');
      if (customerCart) {
        cart = customerCart;
        if (guestCart && guestCart.id !== customerCart.id) {
          const guestLines = await tx.select().from(commerceCartLines).where(eq(commerceCartLines.cartId, guestCart.id));
          for (const line of guestLines) {
            await tx.insert(commerceCartLines).values({ id: randomUUID(), cartId: customerCart.id, productId: line.productId, quantity: line.quantity, updatedAt: now })
              .onConflictDoUpdate({ target: [commerceCartLines.cartId, commerceCartLines.productId], set: { quantity: sql`least(${commerceCartLines.quantity} + excluded.quantity, 99)`, updatedAt: now } });
          }
          await tx.delete(commerceCarts).where(eq(commerceCarts.id, guestCart.id));
        }
      } else if (guestCart) {
        const [attached] = await tx.update(commerceCarts).set({ customerId: input.customer.id, guestTokenHash: null, expiresAt: new Date(now.getTime() + cartLifetimeMs), updatedAt: now }).where(eq(commerceCarts.id, guestCart.id)).returning();
        cart = attached;
      } else {
        const [created] = await tx.insert(commerceCarts).values({ id: randomUUID(), customerId: input.customer.id, expiresAt: new Date(now.getTime() + cartLifetimeMs) }).returning();
        cart = created;
      }
    } else {
      const [existing] = await tx.select().from(commerceCarts).where(and(eq(commerceCarts.guestTokenHash, guestHash), gt(commerceCarts.expiresAt, now))).limit(1).for('update');
      if (existing) cart = existing;
      else {
        const [created] = await tx.insert(commerceCarts).values({ id: randomUUID(), guestTokenHash: guestHash, expiresAt: new Date(now.getTime() + cartLifetimeMs) }).returning();
        cart = created;
      }
    }
    return cart;
  });
}

export async function readCart(cartId: string) {
  const rows = await db.select({ productId: commerceCartLines.productId, quantity: commerceCartLines.quantity, name: products.name, pricePaise: products.pricePaise, image: products.image, category: products.category, material: products.material, isPublished: products.isPublished, contentStatus: products.contentStatus, inventory: productInventory.onHand, reserved: productInventory.reserved })
    .from(commerceCartLines).innerJoin(products, eq(commerceCartLines.productId, products.id)).leftJoin(productInventory, eq(productInventory.productId, products.id))
    .where(eq(commerceCartLines.cartId, cartId)).orderBy(asc(commerceCartLines.createdAt));
  const lines = rows.map((row) => ({ productId: row.productId, quantity: row.quantity, name: row.name, pricePaise: row.pricePaise, image: row.image, category: row.category, material: row.material, isPublished: row.isPublished, contentStatus: row.contentStatus, available: Math.max(0, (row.inventory ?? 0) - (row.reserved ?? 0)) }));
  const subtotalPaise = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  return { lines, subtotalPaise, currency: 'INR' as const };
}

export async function setCartLine(cartId: string, productId: string, quantity: number) {
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(productId) || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 99) throw new CommerceError(400, 'Choose a product and a quantity from 1 to 99, or zero to remove it.');
  return db.transaction(async (tx) => {
    const [product] = await tx.select({ id: products.id, isPublished: products.isPublished }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product || !product.isPublished) throw new CommerceError(404, 'This piece is no longer available in the catalogue.');
    if (quantity === 0) await tx.delete(commerceCartLines).where(and(eq(commerceCartLines.cartId, cartId), eq(commerceCartLines.productId, productId)));
    else await tx.insert(commerceCartLines).values({ id: randomUUID(), cartId, productId, quantity, updatedAt: new Date() })
      .onConflictDoUpdate({ target: [commerceCartLines.cartId, commerceCartLines.productId], set: { quantity, updatedAt: new Date() } });
  });
}

export async function addCartLine(cartId: string, productId: string) {
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(productId)) throw new CommerceError(400, 'Choose a valid product.');
  const [product] = await db.select({ id: products.id, isPublished: products.isPublished }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product || !product.isPublished) throw new CommerceError(404, 'This piece is no longer available in the catalogue.');
  await db.insert(commerceCartLines).values({ id: randomUUID(), cartId, productId, quantity: 1, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [commerceCartLines.cartId, commerceCartLines.productId], set: { quantity: sql`least(${commerceCartLines.quantity} + 1, 99)`, updatedAt: new Date() } });
}

export async function clearCart(cartId: string) {
  await db.delete(commerceCartLines).where(eq(commerceCartLines.cartId, cartId));
}

function validateAddress(value: unknown): ShippingAddress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CommerceError(400, 'Enter a delivery address.');
  const body = value as Record<string, unknown>;
  const fields = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postcode'] as const;
  for (const field of fields) if (body[field] !== undefined && typeof body[field] !== 'string') throw new CommerceError(400, 'Check the delivery address fields.');
  const address: ShippingAddress = {
    fullName: String(body.fullName ?? '').trim(), phone: String(body.phone ?? '').trim(), addressLine1: String(body.addressLine1 ?? '').trim(),
    ...(String(body.addressLine2 ?? '').trim() ? { addressLine2: String(body.addressLine2).trim() } : {}),
    city: String(body.city ?? '').trim(), state: String(body.state ?? '').trim(), postcode: String(body.postcode ?? '').trim(),
  };
  if (address.fullName.length < 2 || address.fullName.length > 160 || !/^\+?[0-9 ()-]{7,32}$/.test(address.phone) || address.addressLine1.length < 5 || address.addressLine1.length > 200 || (address.addressLine2?.length ?? 0) > 200 || address.city.length < 2 || address.city.length > 100 || address.state.length < 2 || address.state.length > 100 || !/^\d{6}$/.test(address.postcode)) throw new CommerceError(400, 'Check the delivery address fields and six-digit PIN code.');
  return address;
}

export async function createDeliveryQuote(cartId: string, customer: CommerceActor, postcodeInput: string) {
  if (!customer.emailVerified) throw new CommerceError(403, 'Verify your email before requesting delivery.');
  const postcode = postcodeInput.trim();
  if (!/^\d{6}$/.test(postcode)) throw new CommerceError(400, 'Enter a valid six-digit PIN code.');
  const config = deliverySettings();
  assertConfiguredFee(config.fee);
  if (!config.postcodes.has(postcode)) throw new CommerceError(422, 'Delivery is not currently available to this PIN code.');
  if (!config.codEnabled) throw new CommerceError(503, 'Cash on delivery is not enabled yet.');
  const cart = await readCart(cartId);
  if (!cart.lines.length) throw new CommerceError(422, 'Your bag is empty.');
  const [owner] = await db.select({ customerId: commerceCarts.customerId }).from(commerceCarts).where(eq(commerceCarts.id, cartId)).limit(1);
  if (owner?.customerId !== customer.id) throw new CommerceError(403, 'Sign in to continue checkout.');
  for (const line of cart.lines) {
    if (!line.isPublished || line.contentStatus !== 'merchant_approved') throw new CommerceError(409, 'A piece in your bag is not yet approved for sale.');
    if (line.available < line.quantity) throw new CommerceError(409, `${line.name} does not have enough available stock.`);
  }
  const [quote] = await db.insert(commerceQuotes).values({ id: randomUUID(), cartId, customerId: customer.id, postcode, subtotalPaise: cart.subtotalPaise, deliveryFeePaise: config.fee, totalPaise: cart.subtotalPaise + config.fee, linesSnapshot: cart.lines.map(({ productId, name, quantity, pricePaise }) => ({ productId, name, quantity, unitPricePaise: pricePaise })), expiresAt: new Date(Date.now() + quoteLifetimeMs) }).returning();
  return { id: quote.id, currency: quote.currency, postcode, subtotalPaise: quote.subtotalPaise, deliveryFeePaise: quote.deliveryFeePaise, totalPaise: quote.totalPaise, expiresAt: quote.expiresAt.toISOString(), paymentMethod: 'cod' as const };
}

export async function placeCodOrder(cartId: string, customer: CommerceActor, quoteId: string, addressValue: unknown, fulfillmentConsent: boolean, idempotencyKey: string) {
  if (!customer.emailVerified) throw new CommerceError(403, 'Verify your email before placing an order.');
  if (fulfillmentConsent !== true) throw new CommerceError(400, 'Confirm that your address may be used to fulfil this order.');
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) throw new CommerceError(400, 'A valid order request key is required.');
  const address = validateAddress(addressValue);
  const config = deliverySettings();
  assertConfiguredFee(config.fee);
  if (!config.codEnabled) throw new CommerceError(503, 'Cash on delivery is not enabled yet.');
  if (!config.postcodes.has(address.postcode)) throw new CommerceError(422, 'Delivery is not currently available to this PIN code.');
  const idempotencyKeyHash = createHash('sha256').update(idempotencyKey).digest('hex');
  const now = new Date();
  return db.transaction(async (tx) => {
    const [previous] = await tx.select().from(commerceOrders).where(eq(commerceOrders.idempotencyKeyHash, idempotencyKeyHash)).limit(1).for('update');
    if (previous) {
      if (previous.customerId !== customer.id) throw new CommerceError(409, 'This order request key has already been used.');
      const lines = await tx.select().from(commerceOrderLines).where(eq(commerceOrderLines.orderId, previous.id));
      return { order: previous, lines, replayed: true };
    }
    const [quote] = await tx.select().from(commerceQuotes).where(and(eq(commerceQuotes.id, quoteId), eq(commerceQuotes.customerId, customer.id), isNull(commerceQuotes.consumedAt), gt(commerceQuotes.expiresAt, now))).limit(1).for('update');
    if (!quote || quote.cartId !== cartId || quote.postcode !== address.postcode) throw new CommerceError(409, 'The delivery quote expired or no longer matches this checkout. Request a fresh quote.');
    if (quote.deliveryFeePaise !== config.fee) throw new CommerceError(409, 'Delivery pricing changed. Request a fresh quote.');
    const lines = await tx.select({ productId: commerceCartLines.productId, quantity: commerceCartLines.quantity, name: products.name, pricePaise: products.pricePaise, image: products.image, isPublished: products.isPublished, contentStatus: products.contentStatus, onHand: productInventory.onHand, reserved: productInventory.reserved })
      .from(commerceCartLines).innerJoin(products, eq(commerceCartLines.productId, products.id)).innerJoin(productInventory, eq(productInventory.productId, products.id))
      .where(eq(commerceCartLines.cartId, cartId)).orderBy(asc(commerceCartLines.productId)).for('update');
    if (!lines.length || lines.length !== quote.linesSnapshot.length) throw new CommerceError(409, 'Your bag changed. Request a fresh delivery quote.');
    const snapshots = [...quote.linesSnapshot].sort((a, b) => a.productId.localeCompare(b.productId));
    const subtotal = lines.reduce((sum, line, index) => {
      const snap = snapshots[index];
      if (!snap || line.productId !== snap.productId || line.quantity !== snap.quantity || line.pricePaise !== snap.unitPricePaise || !line.isPublished || line.contentStatus !== 'merchant_approved') throw new CommerceError(409, 'A product price, approval or bag quantity changed. Request a new quote.');
      if ((line.onHand ?? 0) - (line.reserved ?? 0) < line.quantity) throw new CommerceError(409, `${line.name} no longer has enough stock.`);
      return sum + line.pricePaise * line.quantity;
    }, 0);
    if (subtotal !== quote.subtotalPaise || quote.deliveryFeePaise + subtotal !== quote.totalPaise) throw new CommerceError(409, 'The quoted total is no longer valid. Request a fresh quote.');
    const orderId = randomUUID();
    const orderNumber = `F${Date.now().toString(36).toUpperCase()}${randomUUID().slice(0, 4).toUpperCase()}`;
    const [order] = await tx.insert(commerceOrders).values({ id: orderId, orderNumber, customerId: customer.id, quoteId: quote.id, idempotencyKeyHash, status: 'placed', paymentMethod: 'cod', paymentStatus: 'amount_due', currency: 'INR', subtotalPaise: quote.subtotalPaise, deliveryFeePaise: quote.deliveryFeePaise, totalPaise: quote.totalPaise, addressSnapshot: address, fulfillmentConsentAt: now, fulfillmentConsentVersion: 'delivery-fulfillment-v1', updatedAt: now }).returning();
    const reservationExpiry = new Date(now.getTime() + reservationLifetimeMs);
    for (const line of lines) {
      const [stock] = await tx.update(productInventory).set({ reserved: sql`${productInventory.reserved} + ${line.quantity}`, updatedAt: now })
        .where(and(eq(productInventory.productId, line.productId), sql`${productInventory.onHand} - ${productInventory.reserved} >= ${line.quantity}`)).returning({ productId: productInventory.productId });
      if (!stock) throw new CommerceError(409, `${line.name} has just sold out. Your order was not placed.`);
      await tx.insert(commerceOrderLines).values({ id: randomUUID(), orderId, productId: line.productId, skuSnapshot: line.productId, nameSnapshot: line.name, imageSnapshot: line.image, quantity: line.quantity, unitPricePaise: line.pricePaise, lineTotalPaise: line.pricePaise * line.quantity });
      await tx.insert(commerceReservations).values({ id: randomUUID(), orderId, productId: line.productId, quantity: line.quantity, expiresAt: reservationExpiry });
    }
    await tx.update(commerceQuotes).set({ consumedAt: now }).where(eq(commerceQuotes.id, quote.id));
    await tx.delete(commerceCartLines).where(eq(commerceCartLines.cartId, cartId));
    return { order, lines: await tx.select().from(commerceOrderLines).where(eq(commerceOrderLines.orderId, orderId)), replayed: false };
  });
}

export async function listCustomerOrders(customerId: string) {
  const orders = await db.select().from(commerceOrders).where(eq(commerceOrders.customerId, customerId)).orderBy(sql`${commerceOrders.createdAt} desc`).limit(100);
  const result = [];
  for (const order of orders) result.push({ ...order, lines: await db.select().from(commerceOrderLines).where(eq(commerceOrderLines.orderId, order.id)) });
  return result;
}

export async function listStaffOrders(limit: number) {
  return db.select({ order: commerceOrders, customerName: customers.fullName, customerEmail: customers.email }).from(commerceOrders).innerJoin(customers, eq(commerceOrders.customerId, customers.id)).orderBy(sql`${commerceOrders.createdAt} desc`).limit(limit);
}

export async function cancelCodOrder(orderId: string, actorId?: string) {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(commerceOrders).where(eq(commerceOrders.id, orderId)).limit(1).for('update');
    if (!order) throw new CommerceError(404, 'Order not found.');
    if (order.status === 'cancelled') return order;
    if (order.paymentStatus !== 'amount_due') throw new CommerceError(409, 'Only unpaid COD orders can be cancelled here.');
    const reservations = await tx.select().from(commerceReservations).where(and(eq(commerceReservations.orderId, orderId), isNull(commerceReservations.releasedAt)));
    for (const reservation of reservations) {
      await tx.update(productInventory).set({ reserved: sql`greatest(0, ${productInventory.reserved} - ${reservation.quantity})`, updatedAt: now }).where(eq(productInventory.productId, reservation.productId));
      await tx.update(commerceReservations).set({ releasedAt: now }).where(eq(commerceReservations.id, reservation.id));
    }
    const [cancelled] = await tx.update(commerceOrders).set({ status: 'cancelled', paymentStatus: 'void', updatedAt: now }).where(eq(commerceOrders.id, orderId)).returning();
    if (actorId) await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId, action: 'order.cod_cancelled', targetId: orderId, metadata: { orderNumber: order.orderNumber } });
    return cancelled;
  });
}

export async function expireCodReservations(now = new Date()) {
  return db.transaction(async (tx) => {
    const due = await tx.select().from(commerceReservations).where(and(isNull(commerceReservations.releasedAt), lt(commerceReservations.expiresAt, now))).limit(100).for('update');
    const touchedOrders = new Set<string>();
    for (const reservation of due) {
      await tx.update(productInventory).set({ reserved: sql`greatest(0, ${productInventory.reserved} - ${reservation.quantity})`, updatedAt: now }).where(eq(productInventory.productId, reservation.productId));
      await tx.update(commerceReservations).set({ releasedAt: now }).where(eq(commerceReservations.id, reservation.id));
      touchedOrders.add(reservation.orderId);
    }
    for (const orderId of touchedOrders) {
      const stillReserved = await tx.select({ id: commerceReservations.id }).from(commerceReservations).where(and(eq(commerceReservations.orderId, orderId), isNull(commerceReservations.releasedAt))).limit(1);
      if (!stillReserved.length) {
        const [expired] = await tx.update(commerceOrders).set({ status: 'cancelled', paymentStatus: 'void', updatedAt: now }).where(and(eq(commerceOrders.id, orderId), eq(commerceOrders.paymentStatus, 'amount_due'))).returning({ orderNumber: commerceOrders.orderNumber });
        if (expired) await tx.insert(adminAuditLogs).values({ id: randomUUID(), actorId: null, action: 'order.cod_reservation_expired', targetId: orderId, metadata: { orderNumber: expired.orderNumber } });
      }
    }
    return due.length;
  });
}
