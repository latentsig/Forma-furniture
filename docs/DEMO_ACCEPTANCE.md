# Demo / staging acceptance

**Purpose:** verify a reviewable demo using isolated PostgreSQL and sample-only catalogue data. This checklist does not approve production phases, merchant facts, live payments, COD collection or AI generation.

## Feature matrix

| Feature or journey | State | Evidence / limitation |
|---|---|---|
| Home, collection, search, filters, sorting and editorial pages | REAL (demo catalogue) | Next.js routes backed by the API. 100 sample products; not approved for sale. |
| Product detail, original imagery, three-view gallery and zoom | REAL (demo catalogue) | Existing TypeScript components and Playwright coverage. Prices, descriptions and measurements remain sample facts. |
| Customer registration/sign-in/profile/recovery | PARTIAL | PostgreSQL-backed flows and UI exist. Real email delivery and external identity provider credentials/callbacks are not verified in staging. |
| Google/Facebook sign-in | BLOCKED for hosted acceptance | Code paths exist; OAuth setup, exact deployed callback URLs and provider test-user access are environment-dependent. |
| Admin sign-in, MFA, RBAC, invitation and catalogue operations | PARTIAL | Code and automated flows exist. Production email, operator provisioning and managed key custody remain unverified. |
| Persistent cart, server quote and COD order transaction | STAGING-ONLY / BLOCKED for sale | Code paths and DB migrations exist. Staging COD is forced off; sample products have no sellable stock; no COD acceptance is claimed. |
| Online payment, RuPay, refunds and webhook reconciliation | NOT STARTED beyond domain guard | No provider adapter, payment tables, hosted checkout or verified webhook. |
| Order fulfilment, returns and notifications | NOT STARTED beyond policy guard | Transition validator is not connected to DB/order routes or delivery/email operations. |
| AI image edit/generation | NOT STARTED beyond validation guard | No model call, job queue, storage or admin review UI. |
| Android/iOS native app | NOT STARTED | Explicitly outside R0/R1. |

## P0/P1 journey backlog

| Priority | Journey gap | Proposed next work | Dependencies | Required acceptance test |
|---|---|---|---|---|
| P0 | Product “Buy now” currently has same behavior as “Add to bag” | Define a demo-safe checkout destination; preserve cart and show clearly unavailable payment/COD states without implying an order | Product decision; Phase 5/6 production gates remain closed | Playwright verifies Add to bag and Buy now have distinct expected behavior, no duplicate item, and no false order/payment success |
| P0 | Hosted storefront cannot reliably reach a deployed API unless `FORMA_API_URL` is set | Configure Vercel server-only origin and API service DNS/TLS; verify `/api/ready` and catalogue response from the deployed site | DevOps deployment account/domain; backend host | Deployed smoke: frontend readiness reports API+PostgreSQL connected; collection lists API records |
| P0 | No repeatable staging environment/CI existed | Use the committed compose staging stack or deploy isolated equivalents; require CI on PR | Docker daemon locally or staging provider | Clean build, migrations, sample seed, backend integration, frontend production build, Playwright |
| P1 | Cart/checkout exists only in a drawer and is not a payment flow | Plan standalone URLs and clear journey states after demo acceptance; do not activate payment until authorized | Product/UI approval; prior phase gates | Refresh/deep-link tests, guest/customer access checks, complete amount and error states |
| P1 | No order detail/tracking route or integrated fulfillment updates | Design after merchant/logistics policy approval and Phase 7 work authorization | Merchant operations/support | Customer can only read own order; staff transitions follow approved policy; event audit and notification tests |
| P1 | Enquiry is a non-sending preview | Add a consent-aware server submission/inbox workflow and visible failure states | Merchant support destination, privacy wording, mail provider | Test sink receives message once; retries do not claim success on failure |
| P1 | Product IDs function as provisional SKUs; no approved variants/inventory | Define merchant SKU/variant/stock import with approval and audit | Merchant SKU/inventory file and owner approval | CSV validation, uniqueness, stock races and order snapshots against approved fixtures |
| P1 | Product URLs are query-based | Add stable approved slugs and backward-compatible redirects when product facts are approved | Product/SEO owner | Deep links, refresh, redirect and 404 tests |
| P1 | OAuth and email are not verified against hosted URLs | Set provider test users/callbacks and an isolated mail sink, then run the recorded flows | Merchant account owner and DevOps secret store | OAuth callback/CSRF/nonce tests plus verify/reset email receipt; no real-user email in demo |

## Demo acceptance checklist

- [x] Frontend `/api/health` returns web liveness (HTTP 200).
- [x] Frontend `/api/ready` returns ready only when the API and PostgreSQL are connected (HTTP 200 with both dependencies connected).
- [x] Backend `/health` and `/ready` return expected liveness/readiness results (HTTP 200; database connected).
- [x] `/`, `/collections`, valid/invalid `/product?id=…`, `/spaces`, `/craft`, `/journal`, `/visit`, `/account`, `/admin`, `/admin/setup` and `/admin/accept-invite` render or return the documented status (Playwright).
- [x] The collection API response contains the expected 100 demo records; all records remain sample-labelled.
- [x] Product images and product gallery images return successfully; no broken image or horizontal overflow was found at 320, 390, 480, 768 and 1280px widths.
- [x] Browser cart actions use server cart state and preserve it after refresh; checkout remains gated and does not place a real order.
- [x] Admin and customer API writes reject cross-origin mutations; protected admin operations enforce role checks.
- [x] COD and payment remain disabled. No live order, payment, production stock or merchant approval is claimed from this demo.
- [ ] CI is green. Workflow is committed but has not run on GitHub; local results are backend integration 23/23, frontend Vitest 8/8, Node catalogue 3/3 and Playwright 19/19.

## Acceptance evidence

Record the environment, commit SHA, exact commands, service responses, browser test totals and screenshots in `docs/PHASE_STATUS.md`. A local staging pass is not a hosted staging pass; hosted staging is pending a reachable staging URL and provider configuration. Production acceptance remains a separate merchant/DevOps sign-off.

Local staging screenshots: [`recovery-home-desktop.png`](screenshots/recovery-home-desktop.png) and [`recovery-collections-mobile.png`](screenshots/recovery-collections-mobile.png). These show the production standalone build with React hydration and local sample catalogue data.
