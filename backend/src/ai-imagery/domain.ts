/** Admin-controlled image concept validation and review workflow primitives. */

export type ImageConceptState = 'queued' | 'processing' | 'review' | 'approved' | 'rejected' | 'failed' | 'cancelled' | 'preview_published';
export type ImageAdminRole = 'OWNER' | 'CATALOG_MANAGER';

export type ImageEditRequest = {
  productId: string;
  sku: string;
  productMerchantApproved: boolean;
  canonicalAssetId: string;
  canonicalSha256: string;
  imageRightsApproved: boolean;
  prompt: string;
  promptVersion: string;
  modelId: string;
  estimatedCostPaise: number;
};

export type ImageEditPolicy = {
  allowedModelIds: readonly string[];
  maximumPromptCharacters: number;
  maximumJobCostPaise: number;
  remainingBudgetPaise: number;
};

export type ImageRequestDecision =
  | { accepted: true; request: ImageEditRequest }
  | { accepted: false; reason: 'invalid_product' | 'unapproved_product' | 'missing_canonical_source' | 'image_rights_unapproved' | 'invalid_prompt' | 'unsupported_model' | 'invalid_cost' | 'job_budget_exceeded' | 'quota_exceeded' };

const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const hashPattern = /^[a-f0-9]{64}$/i;

/** Deterministic validation only; this does not call a model or create a job. */
export function validateImageEditRequest(request: ImageEditRequest, policy: ImageEditPolicy): ImageRequestDecision {
  if (!idPattern.test(request.productId) || !idPattern.test(request.sku)) return { accepted: false, reason: 'invalid_product' };
  if (request.productMerchantApproved !== true) return { accepted: false, reason: 'unapproved_product' };
  if (!idPattern.test(request.canonicalAssetId) || !hashPattern.test(request.canonicalSha256)) return { accepted: false, reason: 'missing_canonical_source' };
  if (request.imageRightsApproved !== true) return { accepted: false, reason: 'image_rights_unapproved' };
  if (typeof request.prompt !== 'string' || !request.prompt.trim() || request.prompt.length > policy.maximumPromptCharacters || !request.promptVersion.trim()) return { accepted: false, reason: 'invalid_prompt' };
  if (!policy.allowedModelIds.includes(request.modelId)) return { accepted: false, reason: 'unsupported_model' };
  if (!Number.isSafeInteger(request.estimatedCostPaise) || request.estimatedCostPaise < 0 || !Number.isSafeInteger(policy.maximumJobCostPaise) || policy.maximumJobCostPaise < 0 || !Number.isSafeInteger(policy.remainingBudgetPaise) || policy.remainingBudgetPaise < 0) return { accepted: false, reason: 'invalid_cost' };
  if (request.estimatedCostPaise > policy.maximumJobCostPaise) return { accepted: false, reason: 'job_budget_exceeded' };
  if (request.estimatedCostPaise > policy.remainingBudgetPaise) return { accepted: false, reason: 'quota_exceeded' };
  return { accepted: true, request: { ...request, prompt: request.prompt.trim() } };
}

export type ImageTransitionRequest = {
  current: ImageConceptState;
  requested: ImageConceptState;
  actorRole: ImageAdminRole | 'WORKER';
};

export type ImageTransitionDecision =
  | { allowed: true; next: ImageConceptState; requiresHumanReview: boolean; publicProductReplacement: false }
  | { allowed: false; reason: 'same_state' | 'transition_not_allowed' | 'role_not_allowed' | 'owner_review_required' };

/** Generated output can only become a labeled preview after explicit owner review. */
export function evaluateImageConceptTransition(request: ImageTransitionRequest): ImageTransitionDecision {
  if (request.current === request.requested) return { allowed: false, reason: 'same_state' };
  if (request.current === 'review' && request.requested === 'approved' && request.actorRole !== 'OWNER') return { allowed: false, reason: 'owner_review_required' };
  if (request.current === 'approved' && request.requested === 'preview_published' && request.actorRole !== 'OWNER') return { allowed: false, reason: 'owner_review_required' };
  const allowed: Partial<Record<ImageConceptState, readonly ImageConceptState[]>> = {
    queued: ['processing', 'cancelled'],
    processing: ['review', 'failed', 'cancelled'],
    review: ['approved', 'rejected'],
    rejected: ['queued'],
    failed: ['queued'],
    approved: ['preview_published', 'rejected'],
    preview_published: ['rejected'],
  };
  if (!allowed[request.current]?.includes(request.requested)) return { allowed: false, reason: 'transition_not_allowed' };
  if (request.current === 'queued' && request.requested === 'processing' && request.actorRole !== 'WORKER') return { allowed: false, reason: 'role_not_allowed' };
  if (request.current === 'queued' && request.requested === 'cancelled' && !['OWNER', 'CATALOG_MANAGER'].includes(request.actorRole)) return { allowed: false, reason: 'role_not_allowed' };
  if (request.current === 'review' || request.current === 'approved' || request.current === 'preview_published') {
    if (request.actorRole !== 'OWNER') return { allowed: false, reason: 'owner_review_required' };
  }
  if (request.current === 'processing' && request.actorRole !== 'WORKER') return { allowed: false, reason: 'role_not_allowed' };
  if ((request.current === 'rejected' || request.current === 'failed') && !['OWNER', 'CATALOG_MANAGER'].includes(request.actorRole)) return { allowed: false, reason: 'role_not_allowed' };
  return { allowed: true, next: request.requested, requiresHumanReview: request.requested === 'review' || request.requested === 'approved' || request.requested === 'preview_published', publicProductReplacement: false };
}
