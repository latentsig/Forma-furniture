# Forma Furniture — prioritized issue backlog

This backlog carries forward the source audit and adds the mobile UI report. A
fix does not count as complete until its stated verification has passed.

| Priority | Issue / references | Proposed fix | Dependencies | Verification |
|---|---|---|---|---|
| P0 | Simulated checkout confirms success without an order (`script.js`, `pages.js`, `index.html`, `collections.html`, `product.html`) | Keep demo status explicit during storefront migration; replace with persisted order workflow only in the checkout phase | Phase 3 backend/data, Phase 5 checkout | Playwright must show no paid/order-success state from local-only action; later PostgreSQL transaction tests |
| P0 | Browser-owned price/stock/cart state (`catalog-data.js`, `pages.js`) | Treat catalogue data as presentation only; move authoritative quote and stock checks to domain services in the scheduled commerce phases | Phase 3 | Tampered client total/stock tests and database transaction tests |
| P1 | Two independent carts; home cart drawer cannot open (`script.js`, `pages.js`, `index.html`, `collections.html`) | Migrate to one typed storefront cart state and consistent cart entry point; preserve demo limitations | Phase 2, then Phase 5 persistence | Playwright cross-page add/update/remove/empty cases |
| P1 | Unvalidated localStorage reaches `innerHTML` (`pages.js`) | Validate any retained demo state and render through React text nodes; do not use stored data as trusted price/stock | Phase 2 | Invalid-shape and markup-like payload tests; browser regression |
| P1 | Reported collection hero copy is clipped on user's mobile capture; small controls and `?` menu glyph (`pages.css`, `cart.css`, `catalog.css`) | Apply Phase 1 responsive direction; use readable control sizes and accessible menu button/icon | Phase 1 design; Phase 2 migration | Screenshots and checks at 320, 390, 768, 1280 CSS px; keyboard, focus and touch checks |
| P1 | Four generic descriptions for 100 products; demo facts/claims unapproved (`catalog-data.js`, editorial pages) | Preserve catalogue structure without inventing facts; require merchant review before production publication | Merchant input; Phase 3 product data | Field-by-field approval and publication-state checks |
| P1 | Enquiry forms show local success and do not deliver (`script.js`, `pages.js`, `visit.html`, `index.html`, `README.md`) | Label demo behavior honestly; add submitted/pending/error flow only with a defined delivery path | Merchant contact process; backend phase | UI success/failure tests; later integration delivery test |
| P1 | Invalid product IDs silently fall back to first catalogue item (`pages.js`, `product.html`) | Add an explicit not-found state and stable typed product lookup | Phase 2 | Valid/invalid product route E2E and metadata check |
| P2 | Images total about 76.78 MB; 13 exceed 1 MiB (`image assets/`) | Keep originals, review provenance, then generate responsive derivatives without overwriting source | Asset rights review; Phase 2 | Asset manifest, image decode and visual comparison; size budget |
| P2 | Space cards say six but show five; links are generic (`spaces.html`) | Correct count and define destinations after content approval | Content approval | Content/link assertions |
| P2 | No automated suite, accessibility checks or CI | Introduce phase-appropriate Vitest/Playwright and accessibility checks; do not misreport unrun tests | Phase 2 onward | Test outputs and CI run evidence |
