import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertPaymentAmount, decidePaymentTransition, type VerifiedPaymentEvent } from './domain.ts';

const event: VerifiedPaymentEvent = {
  eventId: 'gateway-event-1', provider: 'razorpay', providerOrderId: 'provider-order-1',
  providerPaymentId: 'provider-payment-1', state: 'captured', amountPaise: 125_500,
  currency: 'INR', occurredAt: new Date('2026-10-25T10:00:00.000Z'),
};

test('payment state decisions are idempotent and do not allow stale callbacks to downgrade capture', () => {
  assert.deepEqual(decidePaymentTransition('pending', 'captured'), { action: 'apply', next: 'captured' });
  assert.deepEqual(decidePaymentTransition('captured', 'captured'), { action: 'duplicate', next: 'captured' });
  assert.deepEqual(decidePaymentTransition('captured', 'pending'), { action: 'stale', next: 'captured' });
});

test('contradictory terminal callback states require reconciliation', () => {
  assert.equal(decidePaymentTransition('failed', 'captured').action, 'reconcile');
  assert.equal(decidePaymentTransition('refunded', 'captured').action, 'reconcile');
  assert.equal(decidePaymentTransition('captured', 'refunded').action, 'apply');
});

test('gateway event amount and currency must exactly match server-calculated order', () => {
  assert.doesNotThrow(() => assertPaymentAmount({ amountPaise: 125_500, currency: 'INR' }, event));
  assert.throws(() => assertPaymentAmount({ amountPaise: 125_499, currency: 'INR' }, event));
  assert.throws(() => assertPaymentAmount({ amountPaise: 125_500, currency: 'USD' }, event));
  assert.throws(() => assertPaymentAmount({ amountPaise: Number.MAX_SAFE_INTEGER + 1, currency: 'INR' }, event));
});
