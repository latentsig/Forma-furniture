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

**Status:** BLOCKED — the migrated storefront builds and its core catalogue,
gallery, cart and route checks pass. The agreed 320px and 390px responsive
checks, saved Phase 2 screenshots and automated Playwright parity checks remain
unverified, so the phase is not marked PASS. The old root implementation has
been removed on this branch as requested; its original images are preserved in
the frontend.

**Branch:** `phase-2-typescript-storefront`, based on the Phase 1 commit.

**Files created/changed:** Next.js package, lockfile and configuration plus
TypeScript routes in `frontend/`; typed catalogue conversion; typed shared
storefront/cart/gallery; read-only asset route with path containment checks;
backend Node.js TypeScript health server; Phase 2 unit checks. The old root
HTML/CSS/JavaScript and README were removed after the replacement built and core
catalogue/gallery/cart/route checks passed. All 345 image files were moved
unchanged to `frontend/public/image assets/`.

**Behavior migrated in source:** homepage with the enquiry preview, collection
search/category filters and sorting, product detail with explicit not-found
behavior, three-image gallery with previous/next controls and keyboard support,
one demo cart shared across routes (including safe migration from the previous
local bag), old `.html` route redirects, and the spaces/craft/journal/visit
pages. Demo cart, checkout and enquiry interactions clearly state that they do
not create orders or deliver messages. This is not production commerce.

**Checks actually run:**

- Catalogue tests with Node's TypeScript stripping: 3 passed, 0 failed, 0 skipped
  (100 catalogue IDs/category totals, 300 existing gallery references, original
  image route response and path traversal rejection).
- TypeScript syntax transpilation: 16 `.ts`/`.tsx` files scanned, 0 syntax
  diagnostics.
- Global TypeScript 5.9.3 strict check of `frontend/src/catalog.ts`: passed.
- Global TypeScript 5.9.3 strict check of `backend/server.ts` using the installed
  Node type definitions: passed.
- Backend smoke check: `/health` returned `200` JSON; unknown route returned 404.
- Next.js production build using Webpack: passed from an exact source snapshot in
  the writable C: workspace. The repository D: drive has about 114 MB free, so
  dependencies and build output were kept in the C: workspace. The snapshot
  reads the unchanged source catalogue images from the repository.
- `npm run typecheck`: passed with TypeScript 5.9.3.
- `npm test` (Vitest): 4 passed, 0 failed, 0 skipped, including legacy cart
  shape validation and hostile/unknown catalog ID rejection.
- `npm run test:node`: 3 passed, 0 failed, 0 skipped (catalogue counts, original
  300 gallery references, image route response and traversal rejection).
- Backend strict TypeScript check: passed; backend smoke check returned 200 for
  `/health` and 404 for an unknown route.
- HTTP smoke check: homepage, collection, valid product, spaces, craft, journal,
  visit, health and original image route returned 200; invalid product ID
  returned 404.
- Manual browser verification: collection filter showed 25 items; `sunday`
  search showed 1; zoom next changed the image to the side view; add-to-bag
  and buy-now preview updated the shared bag; the previous `.html` collection
  URL redirected to the new route. Test bag was cleared afterward. Home enquiry
  preview renders and explicitly says no message is delivered.
- Responsive overflow check: 480, 768 and 1280 CSS-pixel widths had no document
  overflow. The in-app browser clamps its viewport to 480 CSS pixels, so 320 and
  390 widths could not be set. Automated Playwright E2E checks were not run.

**Screenshots:** Phase 2 desktop, 480px mobile collection, and 480px mobile home
were visually inspected in the browser but were not saved as files. Phase 0
baseline images remain in `docs/screenshots/` and are not evidence for the new
TypeScript storefront.

**Security / compatibility:** no API/payment secrets are present. The new image
route only serves raster formats from inside `frontend/public/image assets/` and
rejects path traversal. The backend exposes only a local health endpoint; no
commerce API, auth, database or payment integration is claimed. Existing old
route bookmarks redirect to the corresponding Next.js routes.

**Remaining blockers:** save browser screenshots and verify 320 and 390 CSS-pixel
layouts in a browser that supports those viewport widths; add/run Playwright E2E
parity coverage. Once those checks pass, Phase 2 can receive PASS.

**Next phase allowed:** NO — Phase 2 acceptance is blocked. Do not begin Phase 3
until the remaining viewport and E2E checks pass.
