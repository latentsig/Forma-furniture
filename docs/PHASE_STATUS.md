# Forma Furniture — Phase Status

Current forward sequence, dependencies and acceptance gates: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Phase 0 — Repository audit, inventory and baseline

**Status:** PASS — audit deliverables and available baseline checks completed. The repository itself remains a static demo, not production commerce.

**Branch / commit inspected:** `phase-0-audit` at `9de73621251d2c932490401f5407525280b76d0e` (branch created from `main`). Working tree contained pre-existing untracked `Backend/` and the supplied roadmap; both were preserved.

**Problems discovered:** two divergent cart stores; inaccessible home bag drawer; fake checkout/order confirmations; no order persistence, API, database, payment, auth/RBAC or admin; repeated catalog descriptions and unverified sample facts; unvalidated localStorage interpolation into `innerHTML`; enquiry forms do not deliver despite stale README wording; subpage mobile menu icon displays `?`; small mobile header text; a page/card-count mismatch; 13 images >1 MiB and missing rights/provenance approvals.

**Files created:** `docs/AUDIT.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/ASSET_REGISTER.md`, `docs/PHASE_STATUS.md`, `docs/screenshots/phase0-home-desktop.png`, `docs/screenshots/phase0-home-mobile.png`. No application source changes.

**Database migrations and rollback:** none. No database exists.

**UI screenshots / evidence:** desktop homepage and mobile homepage/Collections screenshots are saved under `docs/screenshots/`. Browser inspection also covered one product detail and the image zoom. No native-device tests were available.

**Commands executed and summarized output:**

- `node --check script.js`, `node --check pages.js`, `node --check catalog-data.js` — all exited 0.
- Catalog data inspection — 100 items, 25 per category, four unique descriptions, 100 unique IDs and primary images, all galleries contain three views, 0 missing catalog image references.
- Static local reference scan — 146 HTML/CSS paths checked, 0 missing. Catalog image/gallery paths — 300 checked, 0 missing.
- Image inventory — 345 files, 76.78 MB decimal / 73.23 MiB, 0 exact duplicate SHA-256 groups, 13 files >1 MiB.
- README local static server smoke — all seven pages returned HTTP 200.
- Browser manual checks — seating filter 25 results; `sunday` query 1 result; product facts render; zoom opens with controls; no document-level horizontal overflow at 320 × 640 and 390 × 844 on homepage and collection.

**Unit tests:** 0 / passed 0 / failed 0 / skipped 0 — no unit suite exists; no unit tests were run.

**Integration tests:** 0 / passed 0 / failed 0 / skipped 0 — no integration suite/database exists; no integration tests were run.

**E2E tests:** 0 / passed 0 / failed 0 / skipped 0 — no Playwright suite exists; the listed browser checks were manual, not automated E2E tests.

**Responsive / accessibility checks:** visual baseline captured at desktop and 390 × 844 mobile; homepage and collection measured at 320 × 640 and 390 × 844 without document-level horizontal overflow. The collection category strip scrolls horizontally. Subpage menu glyph defect and tiny CTA typography recorded. A user-supplied collection screenshot reports right-edge copy clipping; exact clipping did not reproduce at the controlled 320px CSS viewport and remains to be verified on the originating device/zoom. A full WCAG audit, automated accessibility scan and physical-device checks were not run.

**Security / privacy review:** source-level only. No server trust boundary, payment/auth integration or uploaded room media exists. Identified localStorage trust and `innerHTML` injection exposure; no secrets were printed. `Backend/.env.txt` was empty.

**Known unresolved issues:** see the prioritized backlog in `AUDIT.md`; production commerce is blocked on approved product facts, merchant policies, gateway onboarding, database/deployment configuration and later-phase implementation.

**Documentation updated:** four requested Phase 0 documents plus two screenshots.

**Go / No-Go decision:** GO for an owner review of Phase 0 artifacts. NO-GO for implementation of Phase 1 until explicitly approved.

**Next phase allowed:** YES — the user has now asked to begin implementation and
approved proceeding through the phases in order. Do not skip any phase.

## Phase 1 — Product requirements and UI/UX design

**Status:** PASS — requirements/design direction and prioritized backlog are
documented. Phase 1 defines a proposed mobile-first editorial direction; it does
not claim implementation or merchant approval of business facts.

**Branch:** `phase-1-product-design` (created from the Phase 0 audit branch).

**Files created:** `docs/DESIGN_DIRECTION.md`, `docs/ISSUE_BACKLOG.md`,
`frontend/README.md`, `backend/README.md`. `Backend/` was renamed to `backend/`;
its empty `.env.txt` was preserved. The empty `Frontend/` folder is now
represented as `frontend/` with a README.

**Decisions:** preserve all existing catalogue/images and legacy pages until
their TypeScript replacements pass parity checks. Author app source only in
TypeScript/TSX and use TypeScript-based styles; browser HTML/JavaScript are
unavoidable generated runtime output. No merchant claims or sample catalogue
facts are approved by the design direction.

**Tests run for Phase 1:** 0 (documentation and folder-boundary phase; no app
code changed). No screenshots were captured for this documentation change.

**Remaining decisions/blockers:** seller/product/policy facts and image rights
need merchant approval before production use. These do not block a demo
storefront migration, but production commerce remains out of scope here.

**Next phase allowed:** YES — proceed to Phase 2 storefront TypeScript migration
only; preserve the existing implementation until replacement regression checks
pass. Backend/database/payment phases remain gated by the defined sequence and
required merchant configuration.

## Phase 2 — TypeScript migration and storefront parity

**Status:** PASS — the TypeScript storefront production build, responsive
acceptance checks, saved screenshots, route behavior and automated E2E suite
were verified against the current source.

**Branch / commit:** `phase-2-typescript-storefront` at `da705da`, based on the
Phase 1 baseline.

**Files created/changed:** Next.js package and TypeScript configuration,
frontend routes and storefront components, typed catalogue/cart/gallery, media
route, backend Node.js TypeScript health server, Playwright configuration and
E2E suite, package lock, this status report, and Phase 2 mobile screenshots.
The old root HTML/CSS/JavaScript implementation and README were removed after
replacement checks. All 345 original image files were moved unchanged to
`frontend/public/image assets/`.

**Behavior migrated:** homepage and preview enquiry, collection category/search/
sorting, product details and not-found handling, three-view gallery with
keyboard-accessible zoom, shared demo cart including safe migration from the
legacy local bag, all seven former `.html` route redirects, and the spaces,
craft, journal and visit pages. The cart, checkout and enquiry clearly state
that they do not create orders or deliver messages. This phase does not claim
production commerce.

**Checks actually run:**

- Next.js production build with Webpack: passed on the exact current `frontend/src`
  TypeScript source in the writable C: build workspace; all 9 app/API routes
  compiled and generated.
- `npm run typecheck`: passed, 0 TypeScript errors.
- `npm test -- --run` (Vitest): 4 passed, 0 failed, 0 skipped.
- `npm run test:node`: 3 passed, 0 failed, 0 skipped, including 100 catalogue
  IDs/category totals, all 300 gallery references, media response and traversal
  rejection.
- `npm run test:e2e` (Playwright): 11 passed, 0 failed, 0 skipped against the
  fresh production build. Coverage includes 320/390/480/768/1280 CSS-pixel
  collection widths; 320/390 homepage widths; navigation; category/search/sort
  and empty state; product gallery thumbnails, zoom, keyboard controls, bag and
  cross-route cart persistence; demo checkout; seven legacy redirects; valid and
  invalid product routes; all storefront routes, health API and zero console or
  page errors on expected-success routes.
- Backend strict TypeScript check: passed. Backend smoke checks: `/health` 200
  JSON and unknown route 404.
- HTTP smoke check: home, collection, valid product, spaces, craft, journal,
  visit, health and original image route returned 200; invalid product ID
  returned 404.
- `git diff --check`: passed; root source boundaries contain no authored
  `.html`, `.css` or `.js` files under `frontend/` or `backend/`.

**Screenshots:** `docs/screenshots/phase2-collection-320.png`,
`phase2-collection-390.png` and `phase2-home-390.png` were captured by Playwright
at 320 × 844 and 390 × 844 CSS pixels. Their content and layout were visually
reviewed. These are Phase 2 evidence; Phase 0 screenshots remain historical
baseline only.

**Security / compatibility:** no API/payment secrets are present. The media
route serves only raster formats from inside the frontend asset directory and
rejects path traversal. Old route bookmarks redirect to matching Next.js pages.
The backend currently exposes only a local health endpoint; commerce, auth,
database and payment services are not implemented in Phase 2. The browser
generates HTML/CSS/JavaScript at runtime, while authored app source is TS/TSX.

**Remaining Phase 2 blockers:** none against the Phase 2 acceptance criteria.
Native device testing, full accessibility review, production hardening and
commerce services remain in their scheduled later phases.

**Next phase allowed:** YES — proceed to Phase 3 (backend, PostgreSQL and product
data) only. Do not skip ahead to later phases.

## Phase 3 — Backend, PostgreSQL and product data

**Status:** PASS — PostgreSQL catalog reads are integrated into the storefront,
with explicit service failure states, operational migration guidance and
combined browser/API verification.

**Branch:** `phase-3-backend-postgres`, created from Phase 2 commit `da705da`.

**Files created/changed:** TypeScript Drizzle schema/config, generated SQL
migration, PostgreSQL connection, catalog query service, Node HTTP API,
transactional TypeScript seed, PostgreSQL integration tests, package lock and
environment example under `backend/`; `.env.local` is ignored and untracked.

**Implemented behavior:**

- `GET /health` reports process liveness; `GET /ready` checks a live DB query.
- `GET /api/products` supports bounded pagination, category and case-insensitive
  name/material/category search, and deterministic featured/name/price sorting.
- `GET /api/products/:id-or-slug` returns published records or 404.
- Product rows have stable IDs/slugs, category enum, integer paise prices,
  product/gallery fields, publication flag, content approval status, timestamps
  and database indexes.
- `db:seed` imports all 100 existing typed catalogue records in a transaction;
  repeating it updates matching records and does not create duplicates. Every
  record is marked `sample` and the API returns the price as integer paise.
- Queries use parameterized Drizzle expressions; invalid categories, sort,
  search length and page bounds return 400. Cross-origin calls must match the
  configured exact `FRONTEND_ORIGIN`.
- The Next.js server fetches all catalog pages through the API, validates every
  response field and detects incomplete/duplicate pages. Homepage cards,
  collection filtering/search/sorting, product details/gallery, and bag display
  use the database-backed records. Product detail also resolves directly by ID
  from the API. Catalog outage or malformed data has a visible unavailable
  state; the static catalog is not used as a runtime product fallback.
- API prices are stored/transported as integer paise and converted to rupees for
  display. The existing catalogue image paths and gallery behavior are retained.
- Added local/hosted PostgreSQL setup, least-privilege/TLS configuration,
  release-time migration, backup/restore and seed safety guidance.

**Checks actually run:**

- `npm run typecheck` in `backend/`: passed.
- `npm run db:generate`: emitted migration from the TypeScript schema.
- `npm run db:migrate`: passed; rerun during integration setup also passed.
- `npm run db:seed`: inserted 100 sample records; subsequent seed during test
  setup passed again.
- `npm run test:integration`: 6 passed, 0 failed, 0 skipped against PostgreSQL.
  Checks cover DB readiness, record count and paise conversion, category/search
  filters and literal wildcard handling, price ordering, ID/slug/not-found,
  query validation and CORS rejection/preflight.
- Local service smoke check: `/health` returned `ok`, `/ready` returned
  `connected`, and the product endpoint returned total 100 with the requested
  two-row page.
- Runtime dependency audit: `npm audit --omit=dev` reported 0 vulnerabilities.
- Frontend `npm run typecheck`: passed; backend `npm run typecheck`: passed.
- Frontend `npm test -- --run` (Vitest): 4 passed, 0 failed, 0 skipped.
- Frontend `npm run test:node`: 3 passed, 0 failed, 0 skipped.
- Next.js production build (Webpack): passed; 10 dynamic app/API routes built.
- Playwright against the fresh Phase 3 production server and live PostgreSQL API:
  12 passed, 0 failed, 0 skipped. Includes 320/390/480/768/1280px collection
  overflow, 320/390px homepage, mobile navigation, category/search/sort,
  gallery/zoom, bag/preview checkout, legacy redirects, all routes, invalid IDs
  and API-to-storefront identity/price/image checks.
- An initial Playwright attempt reused a pre-existing Phase 2 process on port
  3100 (6 passed, 6 failed against stale output). It was not treated as current
  source verification; the server was isolated on port 3102 and the full suite
  then passed 12/12.
- `git diff --check`: passed.

**Database / secrets:** the existing local PostgreSQL service on port 5432 was
left untouched because its credentials are not available. An isolated
PostgreSQL 16 development cluster runs on loopback port 55432 in the authorized
C: workspace. A randomly generated local-only credential is stored in ignored
`backend/.env.local`; no credential is committed or returned in logs. This is
development data, not a production database or deployment configuration.

**Security / compatibility:** API binds to `127.0.0.1` by default and sends
`nosniff`, no-store and referrer-policy headers. Product facts remain
`sample`; no merchant-approved content, inventory, cart, orders, authentication
or payment flows are claimed. The frontend server-side API origin is not
browser-exposed. Production database, domain, TLS and deployment credentials
have not been supplied, so production deployment has not been performed. No
merchant content or image-rights approvals were fabricated.

**Verification evidence:** `docs/screenshots/phase3-collection-320.png`,
`phase3-collection-390.png` and `phase3-home-390.png`, captured from the fresh
production build at 320×844 and 390×844 CSS pixels. Phase 2 screenshots were
preserved unchanged. Preview: `http://127.0.0.1:3102/`.

**Remaining limitations:** this phase provides product reads only. Product
facts/images still need merchant approval before production publication. There
is no production database/deployment configuration, inventory, authentication,
customer cart persistence, order recording or payment support; these remain
later scoped phases. Those external merchant/deployment details are not needed
to pass the local Phase 3 acceptance criteria.

**Next phase allowed:** YES — Phase 3 acceptance criteria are complete. Phase 4
(authentication, admin dashboard and RBAC) may begin when explicitly requested;
do not skip phases or imply those capabilities exist yet.

## Phase 4 — Authentication, role-based admin and catalog operations

**Status:** BLOCKED for production acceptance — Phase 4 authentication,
role-based access and staff/catalog workflows are implemented and pass local
automated checks on a separate branch. Production acceptance remains blocked
on operator provisioning and merchant decisions listed below.

**Branch / base commit:** `phase-4-auth-admin-rbac`, branched from completed
Phase 3 commit `f780168`. Its implementation commit `5a49359` was merged to
`main` by merge commit `cc0bf76` on 2026-10-25. Production acceptance remains
blocked as described below.

**Implemented in this increment:**

- PostgreSQL admin-user, hashed-session and audit tables, with generated Drizzle
  migrations `0001_living_forgotten_one.sql` through `0007_watery_christian_walker.sql`.
- Owner bootstrap CLI requiring a strong password, a 32+ character base32 MFA
  secret and a current TOTP code. Bootstrap refuses to create another account
  after any administrator exists. No demo admin account or credentials were
  created.
- Admin passwords use Node scrypt; TOTP follows RFC 6238 and is required for
  every sign-in. MFA secrets are AES-256-GCM encrypted at rest using the
  untracked `ADMIN_MFA_ENCRYPTION_KEY`. Opaque random session tokens are stored
  as SHA-256 digests, expire after eight hours and are revoked when an account
  is disabled.
- Exact OWNER, CATALOG_MANAGER, ORDER_MANAGER, SUPPORT and ANALYST role grants
  are enforced server-side. Owners manage staff, audit, merchant approval and
  publication. Catalog managers can edit/create/import but cannot approve or
  publish. Other roles have read access only. Last active owner cannot be
  removed; owner promotion requires explicit confirmation.
- Protected Node API routes cover session sign-in/revocation, staff list/create/
  role changes/disable, catalog read/create/edit/soft-unpublish, owner-only
  approval/publication, CSV preview/commit, and audit reads. Product writes and
  audit rows share PostgreSQL transactions. Sample records edited by staff are
  moved to unpublished review drafts.
- A TypeScript Next.js BFF stores the bearer session in an HttpOnly,
  SameSite=Strict cookie, validates same-origin mutations and does not expose
  tokens to browser JavaScript. `/admin` provides sign-in, product editing,
  unpublished draft creation, owner approval/publication, CSV import preview,
  and staff/audit controls.
- `/admin/setup` now provides a one-time local first-owner flow. It is disabled
  by default, is explicitly opt-in with `ADMIN_LOCAL_SETUP_ENABLED=true`, only
  accepts loopback requests outside production, closes once any admin exists,
  expires pending setup after ten minutes and requires TOTP before writing the
  OWNER row. Production remains CLI-only. The owner enters their own email and
  password in the local setup screen; no admin credential is stored in this
  repository or sent through chat. The setup URI is rendered as a QR code
  locally in the browser, with manual-key fallback for same-device setup. The
  screen requires a six-digit time-based code and clears expired enrollment so
  the owner can start over with a fresh key.
- OWNER staff onboarding uses a one-time, 24-hour invitation rather than
  asking the owner to collect another person's password or MFA seed. The owner
  chooses the email and least-privilege role; the invitee privately creates a
  password, scans their own locally generated QR, and verifies a six-digit
  TOTP. Enrollment secrets are encrypted or hashed in PostgreSQL, enrollment
  expires after ten minutes, failed TOTP attempts are limited, invitation
  replay is rejected transactionally, and pending invitations can be cancelled.
  Local development can show a private preview URL when explicitly enabled;
  production delivery requires Resend and a verified sender.
- PostgreSQL now has separate customer identity, session and one-use auth-token
  tables in `backend/drizzle/0002_cheerful_dragon_man.sql`. `/account` supports
  profile name/optional phone, password registration, mandatory email
  verification, sign-in, sign-out, single-use password reset and Google sign-in
  with server-side OIDC verification. Customer sessions and recovery tokens
  are opaque; only SHA-256 digests are persisted. Reset revokes existing
  sessions. Customers and admin staff have separate tables and auth routes.
- Local email flows can return test-only verification/reset links when
  `AUTH_LOCAL_DEV_LINKS=true` in ignored backend config. Production email uses
  the configured Resend server API. Google OAuth uses a state, nonce and PKCE
  browser flow; the API validates Google's signature, issuer, audience,
  expiry, verified-email claim and nonce before creating a customer session.
- Administrator password recovery is available from `/admin`: a single-use,
  30-minute token is stored as a digest; generic responses avoid account
  enumeration; successful reset updates the password transactionally, revokes
  sessions, records an audit event and leaves TOTP mandatory. Local preview
  links are test-only. Authenticator-loss recovery requires the same one-use
  email token, then generates an encrypted replacement TOTP secret; the owner
  must scan the QR and verify a current six-digit code before password/MFA
  rotation commits. Existing sessions are revoked and the recovery is audited.
  No MFA bypass is provided.
- Admin and customer authentication throttles use atomic, short-lived
  PostgreSQL buckets shared across API workers. Bucket identifiers are HMACed
  with a key derived from the server-only MFA key; client IP values are not
  stored. Production ingress must provide a stable client address or enforce
  its own edge throttling; the API intentionally does not trust arbitrary
  forwarded-IP headers.

**Checks actually run:**

- Backend `npm run typecheck`: passed.
- Backend `npm run test:integration`: 19 passed, 0 failed, 0 skipped against
  PostgreSQL, including RFC TOTP, password hashing, encrypted MFA, role grants,
  session expiry/disabled-user revocation, admin API denial, sample-edit
  unpublishing, owner approval/publication, staff invitation/password/TOTP
  enrollment/replay rejection, CSV preview/transactional import, and admin
  password recovery (one-use token, generic response, session revocation and
  preserved MFA), authenticator-loss recovery (replacement TOTP, replay
  rejection and revocation), and atomic shared PostgreSQL throttling without
  plaintext IP storage. The run also includes two Facebook OAuth unit tests for
  server-side code exchange, unreturned access tokens, callback mismatch and
  missing credentials.
- Frontend `npm run typecheck`: passed.
- Frontend `npm test`: 4 passed, 0 failed, 0 skipped.
- Frontend `npm run test:node`: 3 passed, 0 failed, 0 skipped; verifies all
  original product/gallery image references resolve and the local image route
  rejects traversal attempts.
- Next.js production build verification: the updated application compiled and
  TypeScript passed in a secret-free temporary copy under the bundled
  dependency root using Webpack; all Facebook BFF routes were present in the
  build. Building directly from the D: checkout remains blocked by the
  environment's cross-drive junctions for `node_modules` (Turbopack cannot
  locate Next, and Webpack resolves the C: package path as a relative module).
- Playwright against an isolated refreshed Phase 4 production preview and live
  API: 18
  passed, 0 failed, 0 skipped. It covers Phase 3 responsive/storefront
  behavior, customer account entry points, admin login/CSRF, owner setup and
  expiration recovery, admin password and authenticator recovery, and the
  staff invitation QR screen. Invitation
  acceptance, expiry and replay behavior are covered by PostgreSQL integration
  tests.
- Latest focused Playwright customer-account/Facebook-fallback run: 2 passed,
  0 failed, 0 skipped against that production build. The Facebook fallback
  correctly explains that Meta configuration is not present.
- `docs/screenshots/phase4-account-social-390.png` captures the mobile sign-in
  form with both social provider buttons.
- The local setup POST is protected by same-origin validation using incoming
  host/forwarded-host values as well as the URL origin, covering the local
  `127.0.0.1` browser URL when Next normalizes its request URL to `localhost`.
  A Playwright regression assertion verifies that the request passes CSRF
  validation and reaches backend input validation.
- Playwright mocks the one-time setup route so both eligible and closed states
  are safe to verify despite an already-provisioned local OWNER. QR generation
  runs locally in the browser and contacts no third-party service. The live
  local database has one configured OWNER, so `/admin/setup` is closed as
  designed.
- `git diff --check`: passed. The report and source changes are on the Phase 4
  branch; no Phase 5 files or services were started.
- `docs/screenshots/phase4-admin-login-390.png` captured at 390×844 CSS pixels.
- `docs/screenshots/phase4-account-390.png` and
  `docs/screenshots/phase4-admin-setup-390.png` captured at 390×844 CSS pixels.
- `docs/screenshots/phase4-admin-password-reset-390.png` captured at 390×844
  CSS pixels and visually reviewed.
- `docs/screenshots/phase4-admin-access-recovery-390.png` captured at 390×844
  CSS pixels; replacement authenticator QR and recovery form visually reviewed.
- `docs/screenshots/phase4-collections-grid-fixed.png` captures the corrected
  four-column collection grid. Manual DOM bounds at the review preview confirmed
  the first card row ends at y=1183.25 and the next begins at y=1223.25, leaving
  the configured 40px row gap with product names and controls inside their row.

**Remaining Phase 4 issues / dependencies:**

- No real merchant-approved SKU exists. The owner publication flow was verified
  with a disposable database fixture, not a merchant product; product facts and
  image rights still need approval.
- Product variants/SKUs and inventory availability are not modeled yet.
- Gallery paths can be reordered or removed in product editing, but binary
  image upload/storage is not implemented; choose/configure an approved private
  object-storage service first.
- CSV supports dry-run and transactional draft import (50 rows, 64 KiB), but
  merchant import ownership and field conventions still need approval.
- Visit/conversion analytics are not collected. Consent, purpose, retention and
  reporting access rules need merchant/privacy approval before instrumentation.
- Admin audit retention currently has no approved expiry policy and is stated
  explicitly in the console. Production ingress must provide stable client IP
  forwarding or edge throttling; arbitrary forwarded-IP headers are not trusted.
- The local untracked MFA encryption key must be copied to a managed secret
  store and preserved; changing it requires an MFA-secret re-encryption plan.
  A local OWNER account exists, so `/admin/setup` is intentionally closed.
  Sign in at `/admin` with the owner password and six-digit authenticator code;
  do not attempt to provision a second initial owner. Password reset and
  verified-email authenticator replacement are implemented, but production
  recovery delivery requires Resend and a verified sender.
- Google OAuth client values are present only in ignored local server-side
  environment files. The configured client now has the exact local JavaScript
  origin and callback, and the local OAuth start reaches Google's Forma account
  chooser without a redirect mismatch. The approved customer email is now
  listed as a test user in the Google project. Full consent/callback is not
  verified because the customer must complete Google account authentication and
  consent in the browser. The client secret was shared in chat and must be
  rotated before production use. Email verification and password reset still
  need a Resend API key and verified sender in production; local preview links
  are test-only.
- Facebook Login for Web is now wired through a state-protected Next.js BFF
  callback and server-only Graph API code exchange. Facebook app secrets never
  enter the browser. Migration `0008_cynical_trish_tilby.sql` adds a unique
  Facebook subject. Existing accounts are not silently linked; new Facebook
  identities remain email-unverified and can request a verification email.
  Live Facebook sign-in remains unverified because Meta app credentials and
  the exact callback are not configured in this environment. Configure
  `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, a Meta-supported
  `FACEBOOK_GRAPH_VERSION`, and the identical exact `FACEBOOK_REDIRECT_URI` in
  the frontend/backend server environments, then register it in Meta Login.
- Production staff invitations cannot be emailed until Resend credentials and
  a verified sender are configured. This local environment has no mail sender;
  local invitation preview links are enabled for development only and must be
  shared through a private channel.
- Native Android/iOS login is not implemented in this phase; Phase 10 will add
  Expo screens using the same customer backend identity and profile records.

**Security / compatibility:** no password, TOTP seed, session token or database
credential is committed or exposed to the frontend bundle. The local dev key
exists only in ignored `backend/.env.local`. The initial OWNER setup is
loopback-only and disabled in production. Customer signup cannot grant staff
access. Guest storefront browsing and the Phase 3 product API remain available.
Orders, payments and shipping are not in this phase.

**Phase 4 decision:** **NO-GO for production checkout.** Its operator
configuration and merchant catalog/storage/privacy decisions remain unresolved.
Per the user's later explicit instruction, Phase 5 local development work is
proceeding behind closed production configuration gates; this does not mark
Phase 4 as passed or authorize production commerce.

## Phase 5 — persistent cart, delivery quote, checkout and COD

**Status:** IN PROGRESS locally; BLOCKED for merchant/production checkout.

**Branch / base:** `phase-4-auth-admin-rbac`; Phase 4 and Phase 5 implementation
are included in the `main` merge commit `cc0bf76`. Phase 4 production status is
still BLOCKED and was not changed to PASS.

**Implemented so far:**

- PostgreSQL guest/customer carts and cart lines, opaque guest-cart tokens held
  in an HttpOnly, SameSite=Strict BFF cookie, server-side cart ownership, and
  guest-to-customer merge on authenticated cart access. Legacy local cart data
  is migrated to the server on first load.
- Server-derived cart prices, integer-paise delivery quotes bound to a verified
  customer, cart and PIN, ten-minute quote expiry, published and
  merchant-approved product checks, and inventory availability checks.
- Transactional COD order creation with address snapshot, explicit fulfillment
  consent/version, item/SKU/price snapshots, stock reservation, unique hashed
  idempotency keys, one-use quotes, and an `amount_due` COD payment state.
  Browser totals do not determine order values; COD is disabled by default.
- Reservation expiry sweep and cancellation release stock. Owner/order-manager
  can list and cancel unpaid COD orders; support can view orders. Customer
  account page can view only that customer's order history.
- Storefront cart now uses the backend, supports checkout address entry, quote
  and COD confirmation. Checkout remains closed unless the server is configured
  with merchant-approved delivery PINs/fees/COD policy and sellable inventory.
- PostgreSQL migrations `0009_persistent_cart_cod.sql` and
  `0010_fulfillment_consent.sql` were applied to the local development database.
  Existing sample products receive zero stock and cannot be ordered.

**Outstanding prerequisites and risks:**

- Phase 4 production dependencies remain open: verified email delivery, exact
  Google OAuth callback/credentials, managed encryption key and trusted ingress.
- Merchant has not approved a sellable SKU, its facts/price/image rights, stock,
  serviceable PINs, delivery/assembly fee or ETA, COD eligibility/fee, address
  retention, order-change/cancellation rules, privacy wording or receipt text.
  Until configured, the feature is a local implementation preview and no real
  COD order should be taken.
- Initial stock uses product ID as a temporary SKU key. A merchant-approved SKU
  and variants model plus authorized stock adjustment UI are still needed.
- Customer order history and basic order-manager operations are implemented;
  notification, invoice, fulfillment and returns remain in their later phases.
- Checks actually run for this local increment:
  - Backend and frontend TypeScript typechecks passed.
  - PostgreSQL migrations `0009_persistent_cart_cod.sql` and
    `0010_fulfillment_consent.sql` applied successfully; a Drizzle generation
    check reported no schema changes afterward.
  - Phase 5 commerce service tests against PostgreSQL: 4 passed, 0 failed,
    0 skipped. They cover verified customer access, guest cart merge, server
    price snapshots, COD idempotency, consent, stock reservation, concurrent
    one-unit checkouts without overselling, cancellation, and expired
    reservation release/voiding.
  - Backend PostgreSQL integration tests: 14 passed, 0 failed, 0 skipped.
  - Frontend Vitest: 4 passed, 0 failed, 0 skipped. Frontend Node checks: 3
    passed, 0 failed, 0 skipped.
  - Playwright against the isolated production-mode frontend preview and API
    previously passed 19 tests (0 failed, 0 skipped), covering responsive
    layouts, persisted guest cart behavior, checkout sign-in gating, and
    customer/admin journeys. A rerun in the current sandbox was blocked because
    Playwright could not spawn its worker (`EPERM`). It does not place a real
    merchant order.
  - Next.js production-mode Webpack build completed in an isolated temporary
    copy; `git diff --check` passed. The D: checkout itself still cannot build
    directly in this environment because its dependency junction crosses
    drives.
  - Backend API health, storefront HTTP response, and secure guest-cart cookie
    were manually checked on the isolated review preview. Preview:
    `http://127.0.0.1:3107/`.
- A Phase 5-specific screenshot has not been saved. No live COD checkout was
  attempted because merchant configuration is intentionally absent.
- Frontend Vitest and Playwright reruns currently hit Windows sandbox
  `spawn EPERM`; prior successful runs are recorded above. The Node catalogue
  suite passed 3 tests in the current run.
- Acceptance is not established: merchant product/policy approval and a
  retained, operator-authorized COD order are absent. The automated fixture
  order is cleaned up after its assertions. Production gates remain open.
- Read-only local readiness check (2026-10-25): COD is disabled, zero valid
  delivery PINs are configured, and PostgreSQL contains zero published
  merchant-approved products with sellable stock. No production order was
  created or represented as accepted.
- Production acceptance handover prepared: see
  [`PHASE5_MERCHANT_APPROVAL.md`](PHASE5_MERCHANT_APPROVAL.md) and
  [`PHASE5_PRODUCTION_CHECKLIST.md`](PHASE5_PRODUCTION_CHECKLIST.md). These
  records separate engineering evidence from merchant approvals and production
  verification; all merchant, developer-release and DevOps sign-offs remain
  pending.

**Next phase allowed:** NO for full Phase 6 integration or production use. At
the user's later explicit request, provider-neutral Phase 6 domain groundwork
has begun in isolation; it does not mark Phase 5 PASS or authorize Phase 6
gateway checkout. Core transaction, race/idempotency, access-control and local
customer/staff journey checks have passing evidence. Phase 5 still cannot
receive PASS until the merchant approves product/SKU facts and commerce policies
and authorizes a retained COD acceptance order. Phase 4 production acceptance
remains separately blocked.

## Phase 6 — online payment and RuPay

**Status:** BLOCKED for gateway integration and production; provider-neutral
domain groundwork only.

**Start condition:** The user explicitly requested Phase 6 to begin after the
Phase 5 handover. Phase 5 remains BLOCKED, so no hosted checkout, order payment,
gateway API, webhook route, production setting, or live-money behavior has been
enabled. Work in this section is an isolated TypeScript contract/state-machine
foundation; the dependency and approval gates in `IMPLEMENTATION_PLAN.md` remain
in force for integration and acceptance.

**Implemented:**

- Added server-side TypeScript gateway adapter contracts for provider selection,
  hosted checkout creation, signature-verified event normalization, and status
  fetch. There is no concrete Razorpay/Cashfree adapter and no provider is
  selected.
- Added a provider-neutral payment state transition decision function. It
  prevents stale callbacks from downgrading a captured payment and routes
  contradictory terminal states to reconciliation instead of guessing.
- Added server-calculated amount/currency equality validation. Browser redirects
  are not a payment authority.
- No payment credential, account, webhook, production config, payment schema,
  route or storefront control was added or changed.

**Checks actually run:**

- `node --experimental-strip-types src/payments/domain.test.ts`: 3 passed,
  0 failed, 0 skipped. Covers monotonic/idempotent transitions, contradictory
  event reconciliation, and amount/currency mismatch rejection.
- Backend `npm run typecheck`: passed.

**Blockers and owners:**

- Phase 5 acceptance, merchant-approved SKU/policies, and authorized COD
  acceptance evidence — Merchant and merchant operations; see
  `PHASE5_MERCHANT_APPROVAL.md` and `PHASE5_PRODUCTION_CHECKLIST.md`.
- Gateway selection and onboarding — Merchant/finance must choose Razorpay or
  Cashfree using an actual merchant account and verify sandbox methods,
  including RuPay availability if required.
- Concrete gateway adapter, persistent attempts/events, transactional online
  order creation, verified webhook processing, refund/reconciliation paths and
  end-to-end tests — Developer, after the entry gates are met.
- Sandbox/production secrets, webhook endpoint registration, TLS, monitoring,
  deployment and rollback — DevOps/release owner after merchant approval.

**Next phase allowed:** NO for provider-specific checkout. At the user's later
request, Phase 7 has a small policy-gated domain foundation only; it does not
enable fulfillment. Complete Phase 5 acceptance and obtain the selected
gateway's merchant sandbox onboarding before implementing or enabling
provider-specific checkout. Production payment remains disabled.

## Phase 7 — fulfillment and after-sales

**Status:** BLOCKED for operational workflow and production; policy-gated
domain groundwork only.

**Start condition:** The user explicitly requested Phase 7 to begin. Phase 6 is
not passed and merchant operations policies are not approved. The work here is
an isolated TypeScript guard that accepts no transition unless a versioned
merchant policy record explicitly allows that state pair and actor role. No
default order lifecycle or legal policy was invented.

**Implemented:**

- Added `backend/src/fulfillment/domain.ts` to validate candidate order-state
  transitions against a supplied policy ID/version, approval record reference,
  approver, approval date, and explicit per-role transition rules.
- Missing/unapproved policy, malformed states, duplicate state changes,
  unlisted transitions and unauthorized roles are denied.
- The guard is not connected to order APIs or PostgreSQL. No order status,
  COD/payment state, customer notification, shipment, return, refund, audit
  record, or production configuration was changed.

**Checks actually run:**

- `npm run test:fulfillment`: 3 passed, 0 failed, 0 skipped. The approved policy
  used by tests is a fixture only and is not merchant approval.
- Backend `npm run typecheck`: passed.

**Blockers and owners:**

- Phase 5 production acceptance and Phase 6 payment gate — Merchant and
  merchant operations; see their status sections above.
- Order/payment/shipment state machine, cancellation windows, returns,
  exchanges, restocking, warranty and refund policy — Merchant business,
  logistics and finance owners must approve written rules; Developer then
  implements and verifies legal transitions.
- Notification channels, verified sender, retry policy, retention and incident
  ownership — Merchant support owner and DevOps approve operations; Developer
  implements delivery/outbox behavior after those decisions.
- Production database, event audit, object/receipt storage, monitoring,
  backups and rollback — DevOps/release owner.

**Next phase allowed:** NO for operational Phase 7 or later-phase integration.
At the user's later explicit request, Phase 8 has deterministic validation and
review-state groundwork only; it does not enable AI image generation. Do not
expose the Phase 7 guard as an order-management operation until Phase 5 and
Phase 6 gates and the merchant-approved Phase 7 policy are complete.
Production fulfillment remains disabled.

## Phase 8 — admin-controlled AI imagery

**Status:** BLOCKED for model integration, persistence, review UI and
production; deterministic domain groundwork only.

**Start condition:** The user explicitly requested Phase 8 to begin. Phase 6 is
not passed, no real SKU/canonical image rights approval is recorded, and no
image-model credential, model/cost allowlist, or private object-storage
configuration is present. This increment adds fail-closed validation/review
logic only; it makes no image API request and does not alter original images.

**Implemented:**

- Added `backend/src/ai-imagery/domain.ts` for deterministic checks of product
  approval, canonical source asset/hash, image-rights approval, prompt version
  and length, configured model allowlist, per-job cost ceiling and remaining
  quota.
- Added a generated-concept review state machine. Worker output can only enter
  human review; only OWNER may approve or publish a preview; generated concepts
  explicitly cannot replace the canonical product image.
- Added `npm run test:ai-imagery` for the domain tests.
- No OpenAI SDK/API call, key, async queue, PostgreSQL migration, storage,
  admin route/UI, generated image, product publication, or production setting
  was added or changed. The model name/cost remain unselected until verified
  against available account access and current provider information.

**Checks actually run:**

- `npm run test:ai-imagery`: 4 passed, 0 failed, 0 skipped. These use fixture
  inputs; they do not represent merchant/product approval or model execution.
- Backend `npm run typecheck`: passed.

**Blockers and owners:**

- Stable real SKU, canonical source image and usage rights — Merchant supplies
  and approves; Developer maps to the catalogue and preserves the source.
- Phase 4 identity/admin production gate and Phase 6 gateway/sequence gate —
  Merchant/owner, Developer and DevOps; see earlier phase sections. No later
  feature acceptance is implied by this isolated groundwork.
- OpenAI API model/account access and approved spend limits — Merchant/owner
  authorizes use and budget; Developer verifies a currently supported model and
  implements server-only calls, limits, retries and provenance; DevOps supplies
  managed server-side credentials, monitoring and secret custody.
- Private object storage, retention/deletion/access policy — Merchant/privacy
  owner approves; DevOps provisions; Developer implements private storage and
  access controls.
- Admin compare/reject/retry/approve/publish-preview UI and persistent async
  job/audit state — Developer after prerequisites; OWNER remains the required
  human approver.

**Next phase allowed:** NO. Phase 8 remains blocked until Phase 6 and other
entry criteria are met and a real source asset's SKU/rights and budget are
approved. No generation or publication has occurred.

## Recovery R0 — merged baseline audit

**Status:** PASS for source/status audit. No Phase 4–8 production acceptance is
implied.

**Inspected main:** `origin/main` at merge commit `cc0bf7641403ebbe0656dd8ada62251ecee9455c`, which merges PR #1 and includes feature commit `5a49359`. Before edits the local feature branch worktree was clean; recovery branch `recovery/r0-r1-staging` was created directly from the fetched `origin/main`. No hard reset, clean, stash or force push was used.

**Audit:** route/API/database/test inventory, feature state and prioritized
customer-journey findings are in [`RECOVERY_AUDIT.md`](RECOVERY_AUDIT.md) and
[`DEMO_ACCEPTANCE.md`](DEMO_ACCEPTANCE.md). The earlier statement that Phase 4–5
changes remained uncommitted was stale after PR #1 merged and has been corrected.

**Source defect found:** merged `backend/src/auth/customer-service.ts` was
syntactically invalid because `validateCustomerPassword` lacked a closing brace.
Node startup failed with `ERR_INVALID_TYPESCRIPT_SYNTAX`; the recovery branch
restores the missing brace. Backend strict typecheck, runtime config tests, API
readiness and the PostgreSQL integration suite are recorded in the recovery
audit.

## Recovery R1 — local/staging deployment reliability

**Status:** IN PROGRESS pending frontend production-build/route/browser evidence
and container/hosted staging evidence. Do not use this status as production
acceptance or as permission to start payment/AI implementation.

**Implemented on `recovery/r0-r1-staging`:**

- Server-only API origin validation now rejects a missing or loopback backend
  origin in production; development retains a loopback default. Production
  canonical site metadata requires an explicit HTTPS `NEXT_PUBLIC_SITE_URL`.
- Backend binds to loopback by default locally. Production startup requires an
  explicit `HOST`, valid `PORT`, exact HTTPS storefront/customer origins and a
  32-byte hex MFA key. Compose staging binds inside its private service network
  while publishing only loopback host ports.
- Frontend `/api/ready` now checks backend `/ready` and PostgreSQL, separately
  from web liveness `/api/health`.
- Added Node 24 multi-stage Dockerfiles, isolated PostgreSQL 16 Compose staging
  with one-off migrations/sample seed, CI with a disposable PostgreSQL service,
  and the deployment/demo/recovery documents.
- Browser screenshot outputs now go to ignored Playwright test artifacts rather
  than overwriting committed historical evidence. Playwright waits for the
  composed readiness endpoint.

**Staging evidence so far:** local PostgreSQL 16.15 database
`forma_furniture_staging` was created after confirming the configured DB host
was loopback. Migrations applied; the existing 100 records were seeded as
samples. A running API on loopback returned `/health` 200, `/ready` 200 with
database connected, 100 catalogue rows, and 404 for an unknown product. The
backend typecheck passed; runtime config passed 2/2, payment 3/3, fulfillment
3/3, AI guard 4/4, and the PostgreSQL integration suite passed 23/23 (0 failed,
0 skipped) after matching the existing test's configured CORS origin. See
[`RECOVERY_AUDIT.md`](RECOVERY_AUDIT.md) for command/tool constraints.

**Remaining R1 gates:** production frontend build and browser smoke against the
staging API/database; Docker Compose build/health verification (Docker daemon is
not available in the current environment); and a hosted staging URL (no Vercel
or API hosting credentials/domain were provided). Until these are evidenced,
R1 cannot receive a hosted-staging PASS. No payment, COD, AI or production
acceptance has been enabled.
