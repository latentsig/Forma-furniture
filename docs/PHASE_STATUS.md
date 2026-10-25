# Forma Furniture — Phase Status

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
