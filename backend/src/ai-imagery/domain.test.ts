import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateImageConceptTransition, validateImageEditRequest, type ImageEditPolicy, type ImageEditRequest } from './domain.ts';

const request: ImageEditRequest = {
  productId: 'approved-product-fixture', sku: 'SKU-FIXTURE-001', productMerchantApproved: true,
  canonicalAssetId: 'canonical-fixture-001', canonicalSha256: 'a'.repeat(64), imageRightsApproved: true,
  prompt: 'Create an editorial living-room setting while preserving the exact chair design.',
  promptVersion: 'fixture-v1', modelId: 'test-image-model', estimatedCostPaise: 125,
};
const policy: ImageEditPolicy = { allowedModelIds: ['test-image-model'], maximumPromptCharacters: 500, maximumJobCostPaise: 500, remainingBudgetPaise: 1_000 };

test('image job validation requires an approved product and rights-cleared canonical source', () => {
  assert.equal(validateImageEditRequest({ ...request, productMerchantApproved: false }, policy).accepted, false);
  assert.deepEqual(validateImageEditRequest({ ...request, imageRightsApproved: false }, policy), { accepted: false, reason: 'image_rights_unapproved' });
  assert.deepEqual(validateImageEditRequest({ ...request, canonicalSha256: 'not-a-hash' }, policy), { accepted: false, reason: 'missing_canonical_source' });
});

test('model allowlist, per-job budget and remaining quota are enforced deterministically', () => {
  assert.deepEqual(validateImageEditRequest({ ...request, modelId: 'unconfigured-model' }, policy), { accepted: false, reason: 'unsupported_model' });
  assert.deepEqual(validateImageEditRequest({ ...request, estimatedCostPaise: 501 }, policy), { accepted: false, reason: 'job_budget_exceeded' });
  assert.deepEqual(validateImageEditRequest(request, { ...policy, remainingBudgetPaise: 100 }), { accepted: false, reason: 'quota_exceeded' });
  assert.equal(validateImageEditRequest(request, policy).accepted, true);
});

test('generated concepts require OWNER review and never replace the canonical product image', () => {
  assert.deepEqual(evaluateImageConceptTransition({ current: 'review', requested: 'approved', actorRole: 'CATALOG_MANAGER' }), { allowed: false, reason: 'owner_review_required' });
  assert.deepEqual(evaluateImageConceptTransition({ current: 'approved', requested: 'preview_published', actorRole: 'OWNER' }), { allowed: true, next: 'preview_published', requiresHumanReview: true, publicProductReplacement: false });
  assert.deepEqual(evaluateImageConceptTransition({ current: 'processing', requested: 'preview_published', actorRole: 'WORKER' }), { allowed: false, reason: 'transition_not_allowed' });
});

test('workers may queue output for review but cannot approve or publish it', () => {
  assert.deepEqual(evaluateImageConceptTransition({ current: 'queued', requested: 'processing', actorRole: 'WORKER' }), { allowed: true, next: 'processing', requiresHumanReview: false, publicProductReplacement: false });
  assert.deepEqual(evaluateImageConceptTransition({ current: 'processing', requested: 'review', actorRole: 'WORKER' }), { allowed: true, next: 'review', requiresHumanReview: true, publicProductReplacement: false });
  assert.deepEqual(evaluateImageConceptTransition({ current: 'review', requested: 'approved', actorRole: 'WORKER' }), { allowed: false, reason: 'owner_review_required' });
});
