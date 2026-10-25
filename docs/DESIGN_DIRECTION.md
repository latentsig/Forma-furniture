# Forma Furniture — Phase 1 UI/UX direction

**Status:** Proposed design direction for review and implementation. This is a
Phase 1 artifact, not a claim that any redesign has shipped.

## Goals

- Keep the calm, editorial Forma identity and let the furniture photography lead.
- Fix the clipped collection hero copy reported in the supplied mobile capture.
- Make category, search and sort controls readable and operable on touch screens.
- Preserve the current catalogue and gallery/zoom affordances during migration.
- Avoid presenting a demo checkout, unverified product facts or enquiry form as
  production commerce.

## Visual direction

- Warm ivory page surfaces, fine neutral dividers, near-black typography and a
  restrained terracotta accent. Product photography remains unfiltered.
- Large editorial display typography on wide screens; scale fluidly with a
  conservative mobile minimum so the headline wraps inside the viewport.
- Use a small, consistent set of spacing and type tokens. Keep product cards
  quiet, with the image, name and price as the visual hierarchy.
- Desktop: editorial hero above a horizontal category/search/filter row and a
  roomy product grid. Mobile: compact header, fully wrapped hero, scrollable
  category navigation with visible affordance, full-width search, clear sort,
  then a two-column product grid with no clipped card content.

## Interaction and accessibility

- Every navigation, search, category, sort, cart and gallery action must be
  keyboard reachable with visible focus and accessible names.
- Product gallery keeps previous/next and close controls plus arrow-key support;
  images retain descriptive alternative text. Dialog focus and Escape behavior
  must be verified.
- At 320, 390, 768 and 1280 CSS-pixel widths, no text or controls may be clipped
  and the document must not overflow horizontally. The category row may scroll
  within its own region.
- Use legible mobile control text and touch areas, reduced-motion support, and
  semantic React markup. Do not encode the menu icon as a question-mark glyph.
- Keep empty search/filter results and invalid product IDs explicit. Keep
  cart/checkout copy honest about demo status until later commerce phases.

## Authored-source constraint

Application source will be TypeScript/TSX. Use a TypeScript-based styling
approach (for example, component-scoped `styled-jsx` in `.tsx` files or typed
style objects) rather than standalone `.css` files. Do not author standalone
`.js` or `.html` application files. Next.js still compiles the app into browser
JavaScript and renders HTML; those are runtime outputs, not authored source.

## Phase 1 acceptance checks

- Document responsive behavior and design tokens before implementation.
- Explicitly account for the supplied mobile clipping report and observed menu
  glyph / small-control issues in the Phase 0 audit.
- Keep product facts, prices, promotions, delivery claims and business history
  pending merchant verification; no speculative commercial copy is approved.
- Identify interaction parity and responsive checks required for Phase 2.

## Decisions still requiring merchant input

- Approval of seller identity, product facts, claims, imagery provenance,
  delivery/assembly, tax display, warranty, returns, cancellation and contact.
- Final brand font licensing and confirmation of the accent color.
- The sample content must be visibly treated as catalogue demo data until
  approved source-of-truth product data is available.
