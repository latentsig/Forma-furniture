import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateOrderTransition, type ApprovedOrderTransitionPolicy } from './domain.ts';

const approvedPolicy: ApprovedOrderTransitionPolicy = {
  policyId: 'fixture-policy', version: 'fixture-v1', approvalRecordRef: 'test-fixture-only',
  approvedBy: 'test merchant approver', approvedAt: new Date('2026-10-25T10:00:00Z'),
  rules: [{ from: 'placed', to: 'packed', roles: ['OWNER', 'ORDER_MANAGER'] }],
};

test('order transitions are rejected when no merchant policy is supplied', () => {
  assert.deepEqual(evaluateOrderTransition({ current: 'placed', requested: 'packed', actorRole: 'ORDER_MANAGER' }), { allowed: false, reason: 'policy_missing' });
});

test('only an explicitly approved policy rule and allowed role can transition an order', () => {
  assert.deepEqual(evaluateOrderTransition({ current: 'placed', requested: 'packed', actorRole: 'ORDER_MANAGER', policy: approvedPolicy }), {
    allowed: true, from: 'placed', to: 'packed', policyId: 'fixture-policy', policyVersion: 'fixture-v1',
  });
  assert.deepEqual(evaluateOrderTransition({ current: 'placed', requested: 'dispatched', actorRole: 'OWNER', policy: approvedPolicy }), { allowed: false, reason: 'transition_not_allowed' });
  assert.deepEqual(evaluateOrderTransition({ current: 'placed', requested: 'packed', actorRole: 'SUPPORT', policy: approvedPolicy }), { allowed: false, reason: 'role_not_allowed' });
});

test('malformed or unapproved policy metadata cannot authorize a transition', () => {
  assert.deepEqual(evaluateOrderTransition({ current: 'placed', requested: 'packed', actorRole: 'OWNER', policy: { ...approvedPolicy, approvalRecordRef: ' ' } }), { allowed: false, reason: 'policy_unapproved' });
  assert.deepEqual(evaluateOrderTransition({ current: '../placed', requested: 'packed', actorRole: 'OWNER', policy: approvedPolicy }), { allowed: false, reason: 'invalid_state' });
  assert.deepEqual(evaluateOrderTransition({ current: 'placed', requested: 'placed', actorRole: 'OWNER', policy: approvedPolicy }), { allowed: false, reason: 'same_state' });
});
