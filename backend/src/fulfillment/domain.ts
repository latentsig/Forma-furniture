/** Policy-gated order workflow primitives; no business transition is defaulted. */

export type FulfillmentActorRole = 'OWNER' | 'ORDER_MANAGER' | 'SUPPORT' | 'CUSTOMER';
export type OrderStateName = string;

export type OrderTransitionRule = {
  from: OrderStateName;
  to: OrderStateName;
  roles: readonly FulfillmentActorRole[];
};

/**
 * A runtime policy must point to a merchant-approved, versioned record. This
 * module validates transitions but deliberately defines no default policy.
 */
export type ApprovedOrderTransitionPolicy = {
  policyId: string;
  version: string;
  approvalRecordRef: string;
  approvedBy: string;
  approvedAt: Date;
  rules: readonly OrderTransitionRule[];
};

export type TransitionRequest = {
  current: OrderStateName;
  requested: OrderStateName;
  actorRole: FulfillmentActorRole;
  policy?: ApprovedOrderTransitionPolicy | null;
};

export type TransitionDecision =
  | { allowed: true; from: OrderStateName; to: OrderStateName; policyId: string; policyVersion: string }
  | { allowed: false; reason: 'invalid_state' | 'same_state' | 'policy_missing' | 'policy_unapproved' | 'transition_not_allowed' | 'role_not_allowed' };

const statePattern = /^[a-z][a-z0-9_]{1,39}$/;

export function evaluateOrderTransition(request: TransitionRequest): TransitionDecision {
  if (!statePattern.test(request.current) || !statePattern.test(request.requested)) return { allowed: false, reason: 'invalid_state' };
  if (request.current === request.requested) return { allowed: false, reason: 'same_state' };
  const policy = request.policy;
  if (!policy) return { allowed: false, reason: 'policy_missing' };
  if (!policy.policyId.trim() || !policy.version.trim() || !policy.approvalRecordRef.trim() || !policy.approvedBy.trim() || !(policy.approvedAt instanceof Date) || Number.isNaN(policy.approvedAt.getTime())) {
    return { allowed: false, reason: 'policy_unapproved' };
  }
  const rule = policy.rules.find((item) => item.from === request.current && item.to === request.requested);
  if (!rule) return { allowed: false, reason: 'transition_not_allowed' };
  if (!rule.roles.includes(request.actorRole)) return { allowed: false, reason: 'role_not_allowed' };
  return { allowed: true, from: request.current, to: request.requested, policyId: policy.policyId, policyVersion: policy.version };
}
