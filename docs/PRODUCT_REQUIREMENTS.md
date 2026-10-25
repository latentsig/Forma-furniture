# Forma Furniture — Product Requirements Baseline

**Document purpose:** Phase 0 evidence-based baseline plus Phase 1 requirements to guide the sequenced TypeScript storefront migration. Proposed commerce capabilities below are not implemented. No merchant facts have been approved.

## Product intent

Create a trustworthy, mobile-friendly Forma storefront where customers can discover real furniture, inspect accurate product details, receive a server-calculated delivery/price quote, complete online payment or eligible COD, and track an order. Staff need controlled tools to maintain the catalog and fulfill orders. The current static site is a visual prototype, not an ordering system.

## Current baseline — verified

- Seven HTML pages with vanilla JavaScript and CSS.
- 100 demo catalog records across Seating, Tables, Bedroom and Storage.
- Client-side category filters, name/category/material search, price/name sort, product details, three-view gallery and keyboard-capable zoom.
- Two independent demo carts and simulated confirmation dialogs.
- No persistent orders, online payment, COD collection workflow, stock control, account system, administrator dashboard, API or database.
- Enquiry forms only show local confirmation; inputs are not sent or stored.
- Prices, dimensions, materials and lead times are sample content; all commercial and business claims require owner approval.

## Customer requirements to validate in Phase 1

1. Browse by category; search by product name and relevant attributes; filter and sort with clear result counts and useful empty/loading/error states.
2. Open a shareable product URL with an accurate title, authentic SKU imagery and alternate angles, product identifiers/SKU, factual description, variants, price/tax presentation, dimensions, weight, materials/finish, stock or made-to-order status, lead time, delivery/assembly, warranty and returns.
3. Maintain one cart across storefront pages/devices where signed in, with server-owned prices, quantity rules, availability and a refreshed quote before checkout.
4. Quote delivery from a verified serviceable PIN code, including shipping, tax and promotional eligibility where merchant rules permit. Explain unavailable locations and delivery estimates without inventing values.
5. Support guest checkout where approved; collect only necessary contact and address information; show privacy notice and explicit choices where required.
6. Offer online gateway checkout only after merchant onboarding and gateway selection; support RuPay only if enabled for that merchant account. Offer COD as a separate order/payment state with configurable eligibility.
7. Show order acknowledgement only after the server records an order. Distinguish pending/failed online payment from captured payment and COD amount due. Allow customer order lookup/status and support contact.
8. Provide accessible keyboard/screen-reader interactions, legible type, focus indicators, adequate contrast and touch targets; respect reduced motion.

## Staff and administrator requirements to validate in Phase 1

- Authenticated staff access with least privilege, server-enforced roles and MFA for administrator roles.
- Product/category/variant/media editing, controlled bulk import, audit history and publish/unpublish status.
- Merchant-approved product facts, prices, stock, lead times and promotional terms; preserve media provenance and approval status.
- Order queue with allowed status transitions, payment reconciliation, COD collection tracking, shipment/tracking, cancellation, return/refund and customer-support history.
- Reports that do not over-collect personal or anonymous visitor information.

## System constraints from the user-approved master request

- Web: Next.js + React + TypeScript.
- Backend: Node.js + TypeScript protected API routes and separate commerce domain services; no Python application backend.
- Data: PostgreSQL and type-safe migrations, constraints, transactions and indexes.
- Payments: approved Razorpay or Cashfree merchant gateway; RuPay where account configuration enables it; COD managed independently.
- Mobile: React Native + Expo + TypeScript only in a later approved phase.
- AI image editing: server-side supported OpenAI Image API model; planner rules deterministic in TypeScript, optional local Ollama only for non-authoritative planning.
- Validation: Vitest, PostgreSQL integration tests, Playwright and real mobile-device tests, in their specified later phases.
- Do not trust client totals, stock, discounts, roles or payment success. Verify payment signatures and webhooks, persist events, and handle duplicate callbacks idempotently.
- Room photos private by default; public sharing requires explicit consent. AI visualization must not be called physically accurate AR.
- Keep the existing catalog, images, gallery and zoom until replacements pass regression checks.

## Merchant decisions and evidence needed

| Decision / fact | Current page content | Needed before production |
|---|---|---|
| Legal seller identity, GST/tax treatment and invoicing | Not present/verified | Merchant-approved entity details and tax-adviser confirmation |
| Catalog truth | Demo name/material/dimension/price/lead-time values | Approved SKU, variant, price, dimensions, weight, material, availability and lead-time source for every sellable item |
| Delivery promise | “Complimentary delivery” above ₹75,000; showroom details | Serviceable PIN codes, shipping fees, exclusions, installation/assembly, damage handling and realistic SLA |
| Cancellation, returns, warranty and refunds | Not specified | Approved written policies and operator workflow |
| Promotions | Free delivery threshold and editorial marketing claims | Start/end dates, eligibility, exclusions, geography and owner of approval |
| Business history/manufacturing | “EST. 2012”, India/maker/sourcing/durability claims | Evidence and approved exact copy, or remove claims |
| Contact | `hello@forma.studio`, Museum Road address, hours and generic social links | Confirm control/ownership, monitored contact path and correct public profiles |
| Payment gateway | None configured | Merchant account, approved gateway, accepted methods (including RuPay), settlement/refund and webhook configuration |
| COD | None | Eligibility rules, fee, verification, collection and reconciliation ownership |
| Privacy and analytics | No privacy/consent flow | Data inventory, notice, retention, consent basis and accountable owner |
| Image provenance | README says some product images were AI-generated | Asset-by-asset creator/source/license, approval, product-accuracy review and model disclosure where applicable |

## Phase 1 product and UI/UX acceptance

- The approved starting direction is the editorial, mobile-first treatment documented in [`DESIGN_DIRECTION.md`](DESIGN_DIRECTION.md): warm neutral surfaces, furniture-led imagery, fluid headline sizing, accessible collection controls and a stable two-column mobile catalogue.
- The supplied mobile capture raised a clipped-copy issue. Phase 2 must verify 320, 390, 768 and 1280 CSS-pixel layouts and remove clipping/document overflow while keeping the category scroller usable.
- Preserve all seven current customer routes/journeys, the 100-item demo catalogue, original image assets, search/filter/sort, product details, three-image gallery/zoom, and cart behavior until the TypeScript replacements pass the defined regression checks.
- Mark any simulated cart/checkout/enquiry interaction as demo behavior; do not imply that orders, payments or enquiries are persisted or delivered.
- Authored application files must be TypeScript/TSX. Styling must be authored through TypeScript-based techniques, with no standalone `.js`, `.css` or `.html` application source. Generated browser output may contain JavaScript and HTML.
- Production claims remain blocked on the evidence/merchant approvals in the table above.

## Out of scope in Phase 0

No UI/UX redesign, framework migration, API/backend, database, authentication, admin, cart rewrite, gateway integration, AI feature, native app or production deployment was implemented. These remain sequenced work, each behind its own approval and acceptance gate.
