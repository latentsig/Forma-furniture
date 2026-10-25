/**
 * Provider-neutral payment domain primitives.
 *
 * These types intentionally do not create payment orders or accept browser
 * success redirects. A provider adapter must verify its webhook signature and
 * normalize the event before reconciliation code can consume it.
 */

export type PaymentProvider = 'razorpay' | 'cashfree';
export type PaymentState = 'created' | 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'partially_refunded' | 'refunded';

export type VerifiedPaymentEvent = {
  /** Stable ID assigned by the gateway; persisted with a unique constraint. */
  eventId: string;
  provider: PaymentProvider;
  providerOrderId: string;
  providerPaymentId?: string;
  state: Exclude<PaymentState, 'created'>;
  amountPaise: number;
  currency: 'INR';
  occurredAt: Date;
};

export type PaymentTransitionDecision =
  | { action: 'apply'; next: PaymentState }
  | { action: 'duplicate'; next: PaymentState }
  | { action: 'stale'; next: PaymentState }
  | { action: 'reconcile'; next: PaymentState; reason: string };

/**
 * Do not let delayed webhooks downgrade a captured payment. Contradictory
 * terminal states require a gateway status fetch/manual reconciliation rather
 * than guessing which callback is correct.
 */
export function decidePaymentTransition(current: PaymentState, incoming: VerifiedPaymentEvent['state']): PaymentTransitionDecision {
  if (current === incoming) return { action: 'duplicate', next: current };
  if ((current === 'captured' || current === 'partially_refunded' || current === 'refunded') && (incoming === 'pending' || incoming === 'authorized')) {
    return { action: 'stale', next: current };
  }
  if (current === 'failed' || current === 'cancelled') {
    if (incoming === 'pending' || incoming === 'authorized') return { action: 'stale', next: current };
    return { action: 'reconcile', next: current, reason: `Gateway reported ${incoming} after local state ${current}.` };
  }
  if (current === 'refunded' && incoming !== 'refunded') return { action: 'reconcile', next: current, reason: `Gateway reported ${incoming} after a full refund.` };
  if (current === 'partially_refunded' && incoming === 'failed') return { action: 'reconcile', next: current, reason: 'A failed state cannot overwrite a refunded payment.' };

  const allowed: Record<PaymentState, readonly PaymentState[]> = {
    created: ['pending', 'authorized', 'captured', 'failed', 'cancelled'],
    pending: ['authorized', 'captured', 'failed', 'cancelled'],
    authorized: ['captured', 'failed', 'cancelled'],
    captured: ['partially_refunded', 'refunded'],
    failed: [],
    cancelled: [],
    partially_refunded: ['refunded'],
    refunded: [],
  };
  return allowed[current].includes(incoming)
    ? { action: 'apply', next: incoming }
    : { action: 'reconcile', next: current, reason: `Unsupported payment transition ${current} → ${incoming}.` };
}

export function assertPaymentAmount(expected: { amountPaise: number; currency: string }, event: Pick<VerifiedPaymentEvent, 'amountPaise' | 'currency'>) {
  if (!Number.isSafeInteger(expected.amountPaise) || expected.amountPaise < 0 || event.amountPaise !== expected.amountPaise || event.currency !== expected.currency || event.currency !== 'INR') {
    throw new Error('Verified gateway event amount or currency does not match the server order.');
  }
}

export type HostedCheckoutRequest = {
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  idempotencyKey: string;
  returnUrl: string;
};

export type HostedCheckoutSession = {
  providerOrderId: string;
  checkoutUrl: string;
  expiresAt: Date;
};

/** Provider adapters are server-only and must implement signature verification. */
export interface PaymentGatewayAdapter {
  readonly provider: PaymentProvider;
  createHostedCheckout(request: HostedCheckoutRequest): Promise<HostedCheckoutSession>;
  verifyWebhook(rawBody: Uint8Array, headers: Readonly<Record<string, string | string[] | undefined>>): Promise<VerifiedPaymentEvent>;
  fetchPayment(providerOrderId: string, providerPaymentId?: string): Promise<VerifiedPaymentEvent>;
}
