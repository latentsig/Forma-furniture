# Forma Furniture — Phase 0 Repository Audit

**Status:** PASS — Phase 0 audit and baseline completed. This status means the audit deliverables and listed checks are complete; it does not mean the storefront is production-ready.

**Inspected:** branch `phase-0-audit`, based on `main` at `9de73621251d2c932490401f5407525280b76d0e` (2026-10-25). The working tree had pre-existing untracked `Backend/` and the user-supplied roadmap under `docs/`; those were preserved. `Backend/.env.txt` is empty (0 bytes). No application source was changed in Phase 0.

## Scope and evidence

- Read all seven HTML pages, all six CSS files, all three JavaScript files, `README.md`, and the supplied production roadmap. Catalog data was checked across all records with a Node VM inspection; the rest of the 63.6 KB catalog file was not rewritten or transformed.
- Counted and hashed every file in `image assets/`; checked static HTML/CSS references and all catalog image/gallery references against the checkout.
- Started the documented static server on `127.0.0.1:8002`. All seven HTML routes returned HTTP 200.
- Inspected the homepage, collection and one product page in the in-app browser. Manually checked seating filter (25 results), a `sunday` search (1 result), product detail population, and opening the image zoom. Checked 390 × 844 and 320 × 640 CSS-pixel mobile viewports; homepage and collection have no document-level horizontal overflow.
- Captured baseline screenshots: [`phase0-home-desktop.png`](screenshots/phase0-home-desktop.png), [`phase0-home-mobile.png`](screenshots/phase0-home-mobile.png), and [`phase0-collection-mobile.png`](screenshots/phase0-collection-mobile.png). The product page and zoom were visually checked in the browser but no separate screenshot was persisted.

## Verified starting point

| Claim | Result | Evidence |
|---|---|---|
| Seven static pages | Verified: `index.html`, `collections.html`, `product.html`, `spaces.html`, `craft.html`, `journal.html`, `visit.html` | All seven returned HTTP 200 |
| Static HTML/CSS/vanilla JS; no build/dependencies | Verified for the app root: six CSS files, three JS files; no package manifest, framework configuration, or build script | `README.md`; root file inventory |
| 100 demo products, four categories | Verified: Seating, Tables, Bedroom, Storage; 25 each | `catalog-data.js` parsed and counted |
| Three image views per product | Verified: each record has three gallery paths; 300 catalog image references resolve | Catalog data check |
| Client-side filter, search, sort | Verified in `pages.js`; filter and search manually exercised in browser | Seating → 25; `sunday` → 1 |
| Product details and keyboard-capable zoom | Verified in `pages.js` and product page; zoom opens in browser and exposes close/previous/next controls | Product detail and zoom browser inspection |
| Two cart implementations | Verified. `script.js` maintains an in-memory `bag`; `pages.js` reads/writes `localStorage` key `forma-demo-bag`. These are independent stores and renderers. | `script.js`; `pages.js` |
| Checkout is simulated | Verified. Both checkout forms prevent submission, clear client-side state, and show confirmation dialogs. No order is sent or stored; no payment is collected. | `script.js`; `pages.js`; checkout dialogs in `index.html`, `collections.html`, `product.html` |
| Repeated product descriptions | Verified: 100 products have only four distinct description strings (one shared template per category). | Catalog data count |
| Production commerce capabilities are absent | No app backend/API, database or migrations, authentication/RBAC, admin dashboard, real payment adapter/webhook, test suite, CI workflow, or production deployment configuration found in the inspected root tree. | File inventory; README |

## Page and customer journey inventory

- **Home (`index.html`):** editorial landing page; navigation to collections, spaces, craft, journal and visit; featured product cards; enquiry form; home-specific in-memory bag and simulated checkout. The `Shop` header link navigates to Collections. The home bag drawer has no working header opener because `script.js` only binds the opener when `.cart-trigger` is a button, while the markup uses an anchor. Quick-add updates an in-memory bag/toast, but the user cannot reach the drawer from that page.
- **Collections (`collections.html`):** 100 client-rendered products, four category filters, text search across name/category/material, price/name sorting, product links, add-to-cart dialog, localStorage-backed bag and simulated checkout.
- **Product (`product.html?id=…`):** one reusable detail template populated from the query string; shows sample price/material/dimensions/lead time; add-to-cart and buy-now lead to local bag/checkout; three-view image zoom with buttons and arrow keys. Unknown IDs silently display the first catalog item.
- **Selected spaces (`spaces.html`):** five editorial room cards (although the page metadata says “01 — 06”); card links all lead to Collections, not a product-specific selection.
- **Craft (`craft.html`):** editorial making story and material claims.
- **Journal (`journal.html`):** one static story; displayed reading-time claim is not derived from content.
- **Visit (`visit.html`):** showroom details, map link and enquiry form. The form is intercepted locally and shows a success dialog; it is not sent or stored.

## Commerce, copy and trust gaps

- Browser state is authoritative for displayed totals and quantities. There is no server-side quote, stock validation, inventory reservation or order record. `localStorage` is mutable by the visitor and must never become a trusted source of price/order data.
- Homepage and subpage cart behavior diverges; the demo bags do not synchronize across pages. Checkout confirmations are not purchases.
- The README says enquiries open an email draft, but current `script.js` and `pages.js` intercept the forms and only display local dialogs. The only homepage email action is the separate `mailto:` link.
- Catalog product descriptions repeat four generic category descriptions. The catalog also presents sample prices, dimensions, materials and lead times. The README identifies pricing and product fields as demo content.
- The homepage and editorial pages state showroom address/hours, “EST. 2012”, sourcing, maker, durability and service claims; site-wide copy promises complimentary delivery above ₹75,000 and response within two working days. Footer social links point to generic Instagram/Pinterest homepages. These facts, policies, offer terms and contact details need merchant verification and approval before public commerce.
- Enquiry/check-out input is not transmitted by this static implementation; do not describe the current UI as a working order/enquiry service.

## Responsive and accessibility observations

- CSS has responsive breakpoints for the homepage and subpages; the collection uses a two-column product grid on narrow viewports. At 320 × 640 and 390 × 844, the homepage and collection have no document-level horizontal overflow. At 320px the category row is horizontally scrollable.
- On narrow subpages the menu icon is rendered from a CSS `content: '?'` fallback in `pages.css`, visibly showing `?` rather than a menu/close glyph. `cart.css` sets the mobile header CTA to 6px; other mobile controls use 7–8px text. Review readability and touch-target sizing during Phase 1.
- The follow-up screenshot supplied in the review thread shows collection hero copy cut off at the right edge and the category strip only partly visible. At controlled 320px CSS viewport the hero copy wraps and no page-level overflow occurs, while the category strip remains scrollable; the precise clipping in the supplied capture was not reproducible. Recheck against the originating device/browser zoom in Phase 1.
- Existing semantic elements, image alt text, native dialogs, labelled forms, focus-visible styles and reduced-motion rules are useful starting points. This was not a WCAG audit: keyboard/screen-reader coverage, contrast and touch targets remain unverified.
- Product image zoom currently offers a visible close control, previous/next buttons and arrow-key support. Preserve and regression-test it during migration.

## Security and compatibility observations

- No backend exists, so authentication, authorization, server-side price/stock enforcement, payment signature validation, idempotent webhook handling, rate limiting, persistence and audit logs are not implemented.
- `pages.js` builds bag rows and product cards using `innerHTML`; bag fields are read from unvalidated `localStorage`. Current catalog content is bundled static data, but tampered stored values can reach HTML interpolation. Treat this as a client-side injection risk and use validated data plus safe DOM/text rendering in any replacement.
- No CSP/security-header or privacy/consent implementation was found. No room-photo upload/share feature exists, so its privacy requirements remain future work.
- The root is plain browser code; native device behavior, payment SDK support, database operations, deployment, performance metrics and production security were not tested.

## Prioritized issue backlog

| Priority | Problem / files | Proposed fix | Dependencies | Required verification |
|---|---|---|---|---|
| P0 | Demo checkout looks like an order confirmation but stores/transmits nothing (`script.js`, `pages.js`, checkout dialogs in HTML) | In later commerce phases, replace with server-created order flow; until then make demo status unmistakable | Phase 1 requirements; Phase 3 backend/data; Phase 5 checkout | E2E asserts no false paid state; PostgreSQL order transaction tests; explicit COD and gateway state tests |
| P0 | Prices, totals and product availability are browser data only (`catalog-data.js`, `pages.js`) | Server-owned catalog/quote/inventory with transactional validation; never accept browser totals | Phase 3 | Unit/domain and PostgreSQL concurrency/transaction tests; tampered client-total tests |
| P1 | Separate, unsynchronized carts; home drawer has no opener (`script.js`, `pages.js`, `index.html`, `collections.html`) | Migrate to one cart domain and consistent storefront entry point | Phase 2 parity; Phase 5 persistence | Cross-page Playwright cart regression; add/update/remove/empty-cart cases |
| P1 | Unvalidated localStorage values are inserted through `innerHTML` (`pages.js`) | Validate stored shape and render text safely; later replace local storage as commerce authority | Phase 2/5 | Unit tests for invalid payload and markup-like values; browser injection regression |
| P1 | Four generic descriptions for 100 products and unapproved sample facts/claims (`catalog-data.js`, all editorial HTML, `README.md`) | Merchant review workflow for title, SKU, price, dimensions, material, lead time, provenance, claims and policies; do not invent facts | Merchant evidence; Phase 1 requirements; Phase 3 data model | Signed-off product/claim checklist; schema validation; publication-state tests |
| P1 | Mobile collection capture reports clipped hero copy; category strip is horizontally scrollable; subpage nav glyph renders as `?`; tiny mobile CTA (`pages.css`, `cart.css`, `catalog.css`) | Reproduce on target viewport/zoom; ensure copy fits; improve scroll affordance; replace fallback glyph with accessible icon and readable type/touch targets | Phase 1 design | 320/390/768/1280 responsive screenshots; keyboard and touch target checks |
| P1 | Enquiry forms announce success without delivery/storage; README says email draft (`script.js`, `pages.js`, `visit.html`, `index.html`, `README.md`) | Define honest demo copy now; later implement consent-aware, validated server submission and delivery/error states | Merchant contact workflow; Phase 1; backend if production | Browser tests for success/failure; integration test for persisted/delivered enquiry |
| P1 | Product query fallback silently shows first product for invalid IDs (`pages.js`, `product.html`) | Add an explicit not-found state and canonical product URL behavior | Phase 1/2 | Playwright valid/invalid ID tests; metadata and 404 checks |
| P2 | Five space cards conflict with “01 — 06”; cards route generically to Collections (`spaces.html`) | Correct count and decide intended destinations | Merchant content approval | Link/count content checks |
| P2 | Product media totals about 76.78 MB; 13 files exceed 1 MiB (`image assets/`) | Generate responsive compressed derivatives and verify visual quality without replacing originals blindly | Phase 2 asset migration; image rights/provenance review | Build asset-size budget; screenshot comparison; image decode checks |
| P2 | No automated checks, accessibility suite, CI or deployment evidence | Add phase-appropriate validation after architecture/requirements are approved | Phase 1+; CI ownership | Vitest, PostgreSQL integration, Playwright, accessibility, device and CI reports by phase |

## Baseline command results

- `node --check script.js`: exit 0.
- `node --check pages.js`: exit 0.
- `node --check catalog-data.js`: exit 0.
- `catalog-data.js` VM inspection: 100 products; 25 per category; 4 unique descriptions; 100 unique IDs and primary images; every gallery has 3 views; no referenced catalog images missing.
- Static link scan: 146 local HTML/CSS references, 0 missing. Catalog scan: 300 image/gallery references, 0 missing.
- Image audit: 345 files, 76.78 MB decimal (73.23 MiB); no exact duplicate SHA-256 groups; 13 files over 1 MiB.
- HTTP smoke: all seven HTML routes returned 200 from the README-documented local static server.
- Browser manual checks: homepage loaded; seating filter returned 25; search `sunday` returned 1; product details populated; image zoom opened and exposed controls.
- Automated unit/integration/E2E suites: not present and not run (0 tests executed in each suite).

## Phase decision

Phase 0 is complete. This audit does not authorize Phase 1; follow the supplied phase gate and wait for explicit user approval before beginning it. See [`PHASE_STATUS.md`](PHASE_STATUS.md).
