# Forma Furniture — Forward Implementation Plan

**Updated:** 2026-10-25
**Repository:** `latentsig/Forma-furniture`
**Working branch:** `phase-4-auth-admin-rbac`
**Plan status:** Phases 0–3 are recorded as passed; Phase 4 remains blocked for production acceptance; Phase 5 is implemented locally but blocked for production acceptance; Phase 6 has only provider-neutral TypeScript groundwork; Phase 7 has only policy-gated TypeScript groundwork; Phase 8 has only deterministic AI-imagery validation/review groundwork at the user's explicit request. No online gateway checkout, live order fulfillment, image generation or production payment is enabled.

## Execution rules

1. Work on exactly one phase at a time and on a feature branch. Phase 5 local implementation began only after the user's explicit direction to proceed despite Phase 4's production NO-GO; this does not change the Phase 4 status or authorize production checkout.
2. Treat `docs/PHASE_STATUS.md` as the evidence log and this document as the forward work plan. Update both as work moves.
3. A phase passes only when its exit gate is demonstrated by tests and any required merchant/operator review. Missing credentials, approved data, devices, environments or test evidence mean BLOCKED.
4. At a phase gate, report the branch/commit, changed files, migrations, actual test totals, visual evidence, risks, remaining blockers and next-phase decision. Stop for user approval before the next phase.
5. Keep authored application code in TypeScript/TSX. Use Node.js + TypeScript for backend services, PostgreSQL for authoritative data and migrations, and Expo + TypeScript only in Phase 10. Do not build a Python application backend.
6. Keep existing imagery and gallery behavior until replacement checks pass. Never treat demo facts as merchant-approved; never claim orders, payments, AR accuracy or deployment that was not verified.
7. Keep all credentials out of chat, source control and browser bundles. Use local `.env.local` only for development; use managed server-side secrets for hosted services.

## Current verified position

- Phases 0, 1, 2 and 3 are documented as PASS in `docs/PHASE_STATUS.md`.
- Phase 4 has TypeScript storefront/account/admin code, PostgreSQL staff/customer identity, role checks, owner catalog workflows, one-time owner setup, customer password/Google-auth flows, owner-issued staff invitations, single-use admin password recovery that revokes sessions while preserving mandatory TOTP, email-verified authenticator replacement, and atomic PostgreSQL authentication throttles shared across API workers. Current local validation: 17 PostgreSQL integration tests, 18 Playwright tests, 4 Vitest tests and 3 Node checks passed; strict TypeScript checks and a production build passed.
- A local OWNER account exists for the configured owner email. `/admin/setup` is correctly closed once an owner exists. Password and MFA recovery require one-use email access and (for MFA replacement) verification of the new six-digit authenticator code before access returns. Production recovery still requires a verified sender.
- Staff invitation UX and enrollment are locally exercised. Resend credentials and a verified sender are absent, so local previews are not production email delivery and a loopback URL is usable only on the owner's computer.
- Customer Google OAuth code is present, but the server-side Google OAuth client credentials and registered callback are absent. Email verification/reset and production invitations also need a configured email sender.
- Product data remains sample/unapproved. There is no approved production SKU, stock/variant model, order persistence, checkout, COD or payment integration. No Phase 5+ work is represented as complete.
- This Phase 4 worktree is uncommitted. Review its actual `git status` and current HEAD before creating a later branch or merging.

## Phase sequence and gates

| Phase | State | Objective | Entry / exit decision |
|---|---|---|---|
| 0 — Audit and baseline | PASS (recorded) | Preserve and inventory the original static implementation, behavior and assets. | Reopen only to correct factual audit findings; do not remove historical evidence. |
| 1 — Requirements and design | PASS (recorded) | Define customer/staff journeys, responsive direction, content approvals and interaction requirements. | Merchant/product facts stay pending until documented approval. |
| 2 — TypeScript storefront parity | PASS (recorded) | Replace static application code with Next.js/React/TypeScript while retaining catalogue/gallery behavior. | Keep the responsive, route, gallery and cart regression suite green. |
| 3 — PostgreSQL catalogue | PASS (recorded) | Serve validated sample catalogue records from PostgreSQL through typed Node APIs. | Do not treat sample data as sellable truth. |
| 4 — Auth, admin and RBAC | BLOCKED for production acceptance | Close identity, owner/staff operations, production invitation delivery and real-SKU publication evidence. | **Do not start Phase 5 until Phase 4 PASS is recorded and approved.** |
| 5 — Persistent cart, quote, checkout and COD | IN PROGRESS (local/dev only) | Create server-authoritative cart/quote and transactionally persisted COD orders. | Production use still requires Phase 4 PASS, merchant policy/pricing/delivery/COD inputs and isolated PostgreSQL integration tests. |
| 6 — Online payments and RuPay | BLOCKED (provider-neutral groundwork only) | Add one approved gateway, verified webhook processing, reconciliation and refunds. | Requires Phase 5 PASS and merchant sandbox account; no live money in development. The user requested isolated TypeScript domain groundwork before the entry gates; no provider, route, payment schema, checkout or production setting is enabled. |
| 7 — Fulfillment and returns | BLOCKED (policy-gated groundwork only) | Add audited order fulfillment, notifications, cancellations, returns and refund operations. | Requires Phase 6 PASS and merchant-approved operations/policy rules; no live workflow is enabled. The user requested isolated transition-policy groundwork only. |
| 8 — Admin AI imagery | BLOCKED (domain groundwork only) | Generate controlled, provenance-tracked product lifestyle concepts. | Requires approved SKU imagery/rights, approved cost limits and Phases 3, 4 and 6 stable. The user requested isolated validation/review logic only; no model, API, persistence, UI or generated asset is enabled. |
| 9 — Customer room visualization | NOT STARTED | Add private room-image upload and consent-based concept previews/sharing. | Requires Phase 8 PASS and approved privacy/storage/retention rules. |
| 10 — Expo applications | NOT STARTED | Build typed Android/iOS applications on stable commerce APIs. | Requires web checkout/order flows to pass production-like staging. |
| 11 — Hardening and reliability | NOT STARTED | Complete security, accessibility, performance, observability and recovery work. | Run against integrated web/API/mobile scope; resolve all critical/high findings. |
| 12 — Controlled launch and handover | NOT STARTED | Deploy approved, monitored production service and train merchant operators. | Requires all applicable prior gates, merchant signoff, rollback and backup evidence. |

## Phase 4 — close-out plan

Do only these remaining Phase 4 items until its acceptance decision is made:

1. **Operator recovery approval:** document the authorized owner email/channel and response ownership for password/MFA recovery. The account-recovery flow is implemented, generic, audited, single-use, and requires new TOTP enrollment verification; production mail delivery must be verified.
2. **Production invitations and account mail:** configure a verified Resend sender and public app origin in the server secret store. Verify invite, customer email-verification and password-reset links reach the correct public routes, expire, are single-use and do not reveal tokens in logs. Local link mode must remain development-only.
3. **Customer Google entry:** if “Continue with Google” remains a supported customer choice, provision a server-only OAuth web client, register the exact deployed callback and execute a real consent/callback test. Keep admin/staff access owner-invitation plus mandatory MFA.
4. **Owner onboarding and real catalog evidence:** preserve the existing local OWNER. Have the merchant verify seller identity, a first real SKU's facts/price/availability and image rights; validate that an authorized OWNER can review and publish that SKU and a customer sees only the approved values. Do not use seeded demo records as proof.
5. **Production security configuration:** put `ADMIN_MFA_ENCRYPTION_KEY` in a managed secret store with backup/rotation procedures; configure trusted ingress client addressing or edge throttling. Review audit retention and authenticator-loss recovery ownership.
6. **Final regression:** run strict frontend/backend type checks, Vitest, Node tests, isolated PostgreSQL integration/security tests, full Playwright at mobile/tablet/desktop widths, production build with the configured Next.js bundler, dependency/secret review and manual owner/staff/customer walkthroughs. Capture clean screenshots and reconcile counts in the report.

**Phase 4 PASS gate:** all security and authorization tests pass; owner can safely recover access; staff email invitations and customer email/Google paths behave according to the configured product requirements; merchant-approved SKU publication is verified; evidence and operator instructions are recorded. If external credentials or merchant approval are still missing, record BLOCKED and stop.

## Phase 5 — persistent cart, delivery quote, checkout and COD

After explicit Phase 4 approval, implement only Phase 5:

1. Agree guest checkout/account requirements, address fields, consent notice, serviceable PIN codes, shipping/assembly fees, ETA rules, COD eligibility/fees, order changes and receipt wording with the merchant.
2. Add typed PostgreSQL models/migrations for cart lines, SKU/variant, inventory state, delivery quote, address snapshot, order, order items, payment state and idempotency key. Use integer minor units and database constraints.
3. Implement commerce-domain services separate from route handlers. Server derives product price, discount, stock and delivery; client totals are display-only. Reject stale quotes and invalid SKU/quantity combinations.
4. Implement cart create/read/update/remove and guest-to-customer merge with ownership checks. Add inventory reservation/expiry and compensating release inside transaction-safe services.
5. Add a server-calculated delivery quote and a transactional order-create operation. COD is a distinct `payment_status`/collection path: COD starts unpaid/amount-due and never masquerades as captured online money.
6. Add customer order confirmation only after the order commits, plus protected order history and owner/order-manager operations permitted by RBAC.

**Phase 5 tests:** isolated database migration/rollback and transaction tests; altered price/discount/stock; zero and boundary quantities; concurrent buyers; duplicate/idempotent requests; guest merge; unavailable PIN; COD disabled/ineligible; abandoned reservations; unauthorized order reads; API and Playwright purchase journey with no real payment.

**Phase 5 PASS gate:** a verified COD order exists in PostgreSQL, has a server-calculated snapshot and clear collection state, is visible only to authorized customer/staff, is manageable by an authorized staff role, and repeated submission does not duplicate it.

## Phase 6 — online payment and RuPay

1. Select one gateway only after merchant account onboarding (Razorpay or Cashfree) and verify the merchant account actually enables the desired RuPay/card/UPI methods.
2. Use server-only sandbox credentials and official hosted checkout. Create the gateway order from a committed pending order and server-authoritative payable total.
3. Persist gateway attempts and webhook events with unique event IDs and idempotency. Verify signatures on raw request bytes, handle delayed/duplicated/out-of-order callbacks and reconcile against gateway state.
4. Keep order and payment state separate. Only verified capture/settlement becomes paid; failure/pending/cancel does not confirm payment. Implement refund lifecycle and audit.
5. Never accept payment-success redirects as evidence; never store card numbers, CVV, bank credentials or OTP.

**Phase 6 tests:** sandbox success/failure/pending/cancel/refund, forged signature, altered amount, delayed/duplicate/out-of-order event, browser closure, retry, duplicate order attempt and COD regression.

**Phase 6 PASS gate:** all payment states reconcile between PostgreSQL and sandbox gateway, callbacks are idempotent and audited, RuPay availability is evidenced from the merchant configuration. Live money remains off pending Phase 12 approval.

## Phase 7 — operations, fulfillment and after-sales

1. Define merchant-approved order/payment/shipment state machines and legal transitions.
2. Implement pick/pack/dispatch/tracking and customer notifications with retry-safe delivery records.
3. Add policy-driven address changes, cancellation windows, returns/exchanges, refund tracking and inventory restocking.
4. Add verified invoice/receipt data, customer support cases, staff notes and complete audit trails.

**Phase 7 tests:** forbidden state transitions, cancellation after dispatch, partial refund, restock correctness, duplicate notifications, shipment failure, invoice facts and payment/shipment/order reconciliation.

**Phase 7 PASS gate:** one order lifecycle from confirmed purchase or COD through delivery or return is auditable and follows merchant rules.

## Phase 8 — admin-controlled AI imagery

1. Confirm rights and an approved canonical source image for a real SKU. Keep canonical product media separate from generated imagery.
2. Implement deterministic TypeScript task/SKU/prompt/size/privacy/cost validation and persisted async job state.
3. Call supported OpenAI Image API models server-side; use quotas, timeout/retry/cancel, cost/latency logging, provenance and human review. Never expose the API key.
4. Add admin compare/reject/retry/approve/label/publish-preview controls. Do not silently replace an authentic product image.

**Phase 8 tests:** mocked model errors/timeouts, wrong SKU, quota/cost cap, duplicate jobs, no-auto-publish, provenance, audit, retry/cancel and preserved originals.

**Phase 8 PASS gate:** an owner-approved, visibly labeled AI concept can be published as an alternate preview without altering the SKU's canonical image or commerce data.

## Phase 9 — customer room-photo visualization

1. Obtain privacy/legal approval for consent, image retention, deletion, EXIF stripping, storage region and support access. Use private object storage and signed, short-lived access.
2. Implement explicit camera/upload consent, MIME/size validation, malware/content handling as appropriate and private ownership checks.
3. Generate optional room concepts for a real SKU through the Phase 8 job pipeline. Label output as AI concept; never promise true scale or AR accuracy.
4. Add before/after, variations, delete, quota and opt-in share links with expiry/revoke. Default every room photo to private.

**Phase 9 tests:** no-consent, unauthorized read, public link guessing, expiry/revoke, EXIF, oversize/invalid file, delete, quota, duplicate requests, model outage and leakage scans.

**Phase 9 PASS gate:** customer can privately create/delete a clearly labeled concept and explicitly share/revoke an expiring link; commerce works when AI is unavailable.

## Phase 10 — native Android/iOS

1. Confirm native scope, target OS/device matrix, privacy disclosures, app ownership and signing/release operators.
2. Create Expo TypeScript app using typed API contracts and backend auth/cart/orders; do not reuse web DOM components as native UI.
3. Implement browse/product/cart/checkout/account/orders, camera/upload consent, deep links and notification preferences.
4. Integrate only a gateway-supported native/hosted payment return flow approved for physical goods; do not change server payment authority.
5. Establish development builds, EAS credentials/updates, signing, store metadata and staged release process.

**Phase 10 tests:** physical Android and iOS devices, an additional Android vendor, back/navigation, deep links, payment return, accessibility, photo permissions, low-network and offline states, session expiry and push opt-in/out.

**Phase 10 PASS gate:** signed candidate builds pass device test matrix and backend contract checks. Store approval is an external dependency and is reported separately.

## Phase 11 — cross-cutting hardening and reliability

1. Threat model and test authorization, session/MFA lifecycle, CSRF, input validation, SQL parameterization, upload controls, SSRF where applicable, secrets, logs and PII minimization.
2. Replace process-local throttles; apply gateway rate limits; define audit/PII retention and backup/restore ownership.
3. Run WCAG 2.2 AA review: keyboard, screen readers, focus, contrast, errors, reduced motion, zoom and touch targets.
4. Measure real-device and field performance; define budgets for LCP/INP/CLS, images and API latency. Add truthful SEO metadata, canonical URLs, sitemap and schema only for approved product facts.
5. Add structured logs, correlation IDs, health/readiness, actionable alerts, deployment/rollback and disaster-recovery drills.

**Phase 11 tests:** dependency and secret scan, security review, load/abuse tests, WCAG automated + manual review, device matrix, performance reports, backup restoration and incident/rollback tabletop.

**Phase 11 PASS gate:** no unresolved critical/high findings; recovery and operational tests have evidence; accessibility/performance results and accepted exceptions are documented.

## Phase 12 — production pilot and handover

1. Obtain merchant signoff on seller identity, verified SKU data, images/rights, tax, delivery, returns, privacy, support and domain.
2. Provision isolated production/staging PostgreSQL, private media storage, OAuth/email/gateway secrets, HTTPS, monitoring and backups. Confirm least-privilege roles and key custody.
3. Apply reviewed migrations as a release step, seed no demo products into production, verify readiness, backups and rollback.
4. Run non-destructive production smoke. Under merchant authorization, complete one low-risk live payment and one COD order, confirm webhook, stock, invoice, refund, delivery notifications and financial reconciliation.
5. Pilot with monitoring and explicit rollback thresholds; review real incidents/feedback before wider launch.
6. Handover architecture, runbooks, admin training, secret inventory by name only, support responsibilities, retention schedule, release/rollback, backups and deferred scope.

**Phase 12 tests:** production health and route smoke, authorized payment/COD pilot, webhook/refund reconciliation, restore/rollback rehearsal, alert validation and final regression.

**Phase 12 PASS gate:** merchant signs off on tested scope and operating responsibilities. Anything unfinished is listed as deferred, not described as shipped.

## Merchant and operator inputs required by gate

| Needed input | Needed by | Handling |
|---|---|---|
| Approved SKU facts, real price, variants, stock source and image rights | Phase 4 close / Phase 5 | Merchant review and signed approval record; never infer facts from sample catalogue. |
| Seller legal identity, tax/invoice fields and policies for delivery, assembly, COD, cancellation, return and warranty | Phases 5–7 | Written merchant-approved rules and jurisdiction review. |
| Resend verified sender and public origin | Phase 4 production | Store API key server-side; register DNS/domain; never paste the key into chat. |
| Google OAuth web client and exact callback | Phase 4 customer Google sign-in | Store client secret on server; test consent/callback with authorized account. |
| Gateway merchant account, sandbox/live access, webhook secret and RuPay enablement | Phase 6 / Phase 12 | Decide Razorpay vs Cashfree using actual account; live use only after approval. |
| Private object store, region, retention and deletion rules | Phase 4 media upload choice; Phase 8/9 | Approval before any customer room photo upload. |
| Managed database, encryption key custody, backups, domain, monitoring and operations owner | Phase 11/12 | Document access, rotation, restore test, alert recipient and rollback authority. |
| Mobile app owner, store accounts, device access and release responsibility | Phase 10/12 | Obtain organization-controlled signing/build credentials outside source control. |

## Stop/go checklist for each handoff

Before marking a phase PASS, confirm: its entry criteria were met; planned work and migration review are complete; all required tests actually ran with pass/fail/skip totals; no test was silently skipped; responsive/security/compatibility evidence matches scope; merchant/operator decisions are recorded; docs and screenshots are current; no future phase code was mixed in; and the user approved the next phase. Otherwise record FAIL (regression) or BLOCKED (missing external dependency) and continue only within the current phase.
