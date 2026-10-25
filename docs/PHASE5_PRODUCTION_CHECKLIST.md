# Forma Furniture — Phase 5 Production Acceptance Checklist

**Current status: BLOCKED.** This checklist is a handover and evidence tracker,
not permission to change production settings. COD remains disabled unless the
merchant has approved the policy and the release owner has separately
authorized the configuration change.

Related records:

- [Phase status and engineering evidence](PHASE_STATUS.md)
- [Merchant decisions and sign-off](PHASE5_MERCHANT_APPROVAL.md)
- [Phase sequence and acceptance gates](IMPLEMENTATION_PLAN.md)

## Evidence classes

- **Engineering evidence** proves code behavior in a specified test environment.
- **Merchant approval** proves the business facts, rights and policies have an
  authorized owner and version.
- **Production verification** proves the approved build/configuration and
  operational controls work in the actual production environment.

One class cannot substitute for another. A passing fixture test does not prove
a real product is approved; a merchant signature does not prove the deployed
code works; a local health response does not prove production readiness.

## Owners and blockers

| Blocker / decision | Responsible owner | Supporting owner | Required closure evidence | Status |
|---|---|---|---|---|
| Real SKU facts, price/tax, variants and image rights | Merchant (business approver) | Developer (schema, admin workflow and validation) | Signed SKU and price/tax sheet; source and rights record for every canonical image; product published only after authorized review. | BLOCKED |
| Product ID currently serves as temporary SKU; variant-aware inventory is not finished | Developer | Merchant supplies stable SKU/variant mapping | Reviewed schema/migration and admin flow for stable SKUs/variants; migration compatibility evidence; tests for variant isolation and price/stock snapshots. No silent SKU conversion. | BLOCKED |
| Opening inventory, inventory source and reconciliation | Merchant/warehouse owner | Developer; DevOps for access and backup | Dated quantity by SKU/variant, source-of-truth owner, reconciliation cadence and authorized stock-adjustment roles; verified production stock values. | BLOCKED |
| Delivery PIN codes/zones and exclusions | Merchant/logistics owner | Developer; DevOps | Signed service-area list; production config matches approved version; positive/negative PIN tests. | BLOCKED |
| Delivery/assembly fees, taxes, ETA and promotions | Merchant/logistics and tax adviser | Developer; DevOps | Signed fee/ETA/rule tables and customer copy; server-calculated quote tests at boundaries and for exclusions. | BLOCKED |
| COD eligibility, fee, amount bounds and collection/reconciliation | Merchant/finance/logistics | Developer; DevOps | Signed COD policy, named collection/reconciliation operator, reconciliation steps, test evidence; explicit release authorization before enabling. | BLOCKED |
| Customer identity, address fields, fulfillment consent and privacy/retention | Merchant/privacy or legal owner | Developer; DevOps | Approved field-purpose matrix and notice/version; data-retention/deletion and carrier-sharing policy; code stores consent time/version; production access/retention controls verified. | BLOCKED |
| Order acknowledgement and receipt wording/tax data | Merchant and tax adviser | Developer | Approved specimen and seller/tax fields; verify acknowledgement only follows committed order and says COD amount is due, not paid. Formal invoice/receipt delivery is not currently part of Phase 5 implementation. | BLOCKED |
| Phase 4 production identity dependencies needed by checkout | Merchant/owner for sender/provider decisions | Developer and DevOps | Verified production email sender/delivery; exact Google OAuth origin/callback/client config; managed MFA encryption key and recovery/rotation procedure; trusted ingress or edge throttling. No secrets in source/docs. | BLOCKED |
| Production infrastructure and operating controls | DevOps / release owner | Developer | Isolated production PostgreSQL, reviewed migration/rollback, TLS/domain, pool/limits, backup and restore evidence, secret store, stable ingress/throttling, health/readiness, logs/alerts, rollback owner and runbook. | BLOCKED |
| End-to-end acceptance order and retained evidence | Merchant explicitly authorizes; Developer executes; DevOps observes deployment | Finance/operations verifies collection state | Dated authorization; approved SKU and PIN; production/staging deployment identifier; retained order ID and database snapshot; customer/staff access evidence; idempotent retry proof; inventory movement; COD remains amount due until actual collection is verified. | BLOCKED |

## Readiness sequence

### A. Product and inventory

- [ ] Merchant approval record completed and signed in
  [`PHASE5_MERCHANT_APPROVAL.md`](PHASE5_MERCHANT_APPROVAL.md).
- [ ] At least one real SKU and its variants are explicitly approved; no demo
  item is treated as production catalog.
- [ ] Price in INR/paise, tax treatment, dimensions/material facts, lead time,
  warranty and all public claims are approved.
- [ ] Canonical image/gallery and usage rights are recorded per SKU.
- [ ] Stable SKU/variant data model and migration are reviewed; no product ID
  surrogate is mistaken for an approved merchant SKU.
- [ ] Merchant/warehouse supplies a dated opening count and source of truth.
- [ ] Authorized inventory roles, audit trail, reservation rules, cancellation
  release and expiry reconciliation are verified.
- [ ] Production inventory contains only merchant-authorized quantities; no
  fixture/test quantity is copied into production.

### B. Delivery, COD and customer policy

- [ ] Six-digit serviceable PIN list/zones and exclusions are approved.
- [ ] Delivery, assembly, bulky-item, tax, promotion and ETA rules are approved.
- [ ] Test quotes use server data and verify serviceable/unserviceable PINs,
  fee boundaries, stale price/stock and changed policy behavior.
- [ ] COD policy states eligible SKUs/PINs/order values, fee, exclusions,
  failed-delivery handling, collection responsibility and reconciliation.
- [ ] COD configuration remains off until signed merchant policy and explicit
  release authorization are attached.
- [ ] Address/contact fields are necessary and mapped to approved purposes.
- [ ] Fulfillment notice is approved; checkout requires affirmative consent and
  stores the exact notice version and timestamp.
- [ ] Privacy owner approves carrier sharing, retention/deletion, support access
  and customer request process.
- [ ] Merchant/tax adviser approves seller identity and customer acknowledgement
  or receipt content. Customer confirmation follows the committed transaction
  and clearly says “COD amount due”; it must never imply payment was captured.
- [ ] Receipt/invoice delivery is not assumed to exist in Phase 5; any required
  tax invoice workflow is scheduled and gated in the appropriate later scope.

### C. Infrastructure and deployment (DevOps owner)

- [ ] Production environment is separate from local development and any shared
  review preview; environment and release identity are recorded.
- [ ] Production PostgreSQL exists with least-privilege application/migration
  roles, connection limits, encryption/transport configuration and reviewed
  migrations.
- [ ] Migration rehearsal, rollback plan and restore-from-backup evidence are
  attached. Database restore is tested before commerce data is accepted.
- [ ] Server-side secrets are loaded from the managed secret store; no secret
  appears in source, client bundles, logs, screenshots or this handover.
- [ ] Domain, HTTPS, same-origin protections, trusted ingress/client addressing
  and edge/API throttling are configured and verified.
- [ ] Production email sender supports mandatory verified customer identity and
  account recovery; delivery and bounce handling are monitored.
- [ ] MFA encryption key custody, backup, rotation and recovery owner are
  documented. Google OAuth uses the exact production callback/origin and a
  merchant-controlled project/account.
- [ ] Health/readiness checks, structured logs, alerts, retention, on-call
  contact, deployment rollback and incident runbook are operational.
- [ ] Approved delivery settings are entered by the authorized release owner
  only after written change approval. No configuration is changed as part of
  preparing this checklist.

### D. Developer verification

- [x] Automated backend commerce tests passed: 4/4 in local PostgreSQL,
  including idempotency, concurrent stock reservation, cancellation and
  reservation expiry.
- [x] Backend PostgreSQL integration suite passed: 14/14 in the local test
  environment.
- [x] Backend and frontend TypeScript typechecks passed; catalogue/image Node
  checks passed 3/3.
- [x] A previous isolated Playwright run passed 19/19; a later rerun in this
  sandbox could not spawn its worker (`EPERM`). Re-run the full suite in the
  release verification environment and attach machine-readable output.
- [ ] Re-run frontend unit/Vitest and Playwright suites in a supported clean
  environment; record exact commands, environment/build IDs, pass/fail/skipped
  totals and artifacts. Current sandbox rerun also encountered `spawn EPERM`.
- [ ] Build the release candidate from the reviewed branch/commit and attach
  build output and artifact digest.
- [ ] Confirm migrations run cleanly against a disposable production-like DB;
  test rollback/restore separately without touching production data.
- [ ] Test customer scoping and role-based staff access against the release
  candidate: another customer cannot read an order; SUPPORT can read but cannot
  cancel; ORDER_MANAGER/OWNER can perform only allowed COD operations.
- [ ] Test boundary quantity, zero/remove, stale price/stock/quote, unavailable
  PIN, COD disabled/ineligible, duplicate submission, concurrent buyers,
  abandoned reservation, failure rollback and audit record behavior.
- [ ] Verify no order success is shown before commit; customer and authorized
  staff see the same committed server snapshot; amount due remains distinct from
  collected/captured payment.

### E. Final acceptance run (Merchant + Developer + DevOps)

Do not run against production until the merchant has approved the exact SKU,
PIN, fee and COD policy, and DevOps has approved the release/environment.

- [ ] Attach dated merchant authorization identifying a controlled test order,
  environment, acceptable operational impact, and cancellation/cleanup
  instructions. Do not use a fabricated customer/product record as merchant
  acceptance evidence.
- [ ] Deploy the reviewed candidate to the explicitly authorized environment;
  record branch, commit, build digest, migration version and configuration
  version without recording secrets.
- [ ] Confirm selected SKU and stock are approved and available; quote the
  approved delivery PIN and check exact item, fee and total against server data.
- [ ] Submit one authorized COD order and retain order ID/number and evidence
  that its PostgreSQL row, item/SKU/price snapshots, consent version/time,
  inventory reservation and `amount_due` collection state committed together.
- [ ] Refresh and retry with the same idempotency key; verify the same order is
  returned and no duplicate order or reservation is created.
- [ ] Verify the customer can view only their own order; verify allowed staff
  roles can view/manage it and unauthorized roles cannot.
- [ ] Verify merchant-authorized cancellation/expiry path releases reserved
  stock, updates order/payment states and writes the expected audit record.
- [ ] If a live COD dispatch/collection is explicitly authorized, reconcile
  collection with the named finance operator. Never label an unpaid COD order
  “paid”; retain collection evidence separately.
- [ ] Merchant, developer and DevOps complete their sign-offs below; update
  [`PHASE_STATUS.md`](PHASE_STATUS.md) with evidence links and exact totals.
- [ ] Mark Phase 5 PASS only after every mandatory item is complete; otherwise
  leave status BLOCKED and record the specific missing evidence.
- [ ] Do not begin Phase 6 until Phase 5 PASS and explicit next-phase approval.

## Sign-off and evidence index

| Owner | Name / role | Evidence references | Sign-off record | Date | Status |
|---|---|---|---|---|---|
| Merchant/business approver |  |  |  |  | Pending |
| Merchant finance/logistics/privacy owners (as applicable) |  |  |  |  | Pending |
| Developer/release engineer |  |  |  |  | Pending |
| DevOps/production operator |  |  |  |  | Pending |

**Current blocker report:** Engineering has implemented the local Phase 5
workflow and its backend tests pass. Merchant SKU, rights, inventory and
commerce-policy approvals are not present; production infrastructure/config is
not verified; COD is disabled; no merchant-authorized retained COD acceptance
order exists. The production gate is therefore BLOCKED, with no Phase 6 work
authorized by this checklist.
