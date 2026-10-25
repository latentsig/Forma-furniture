# Forma Furniture frontend

Next.js App Router storefront authored in TypeScript/TSX. Browser product
catalogue, detail and bag data come from the Phase 3 Node.js commerce API backed
by PostgreSQL. Product prices arrive in integer paise and display in rupees.
The local bag remains preview-only and does not create an order.

The Next.js server reads the internal API with `no-store`. Set `FORMA_API_URL`
to the backend origin on the frontend server (default
`http://127.0.0.1:4100`). Keep this as a server variable, never a
`NEXT_PUBLIC_*` value. Catalog data failures produce an explicit unavailable
message rather than falling back to stale product data. The unchanged original
image files remain in `public/image assets` and are delivered through the typed
media route.

## Run locally

Use Node.js 22.18 or later. First follow `backend/README.md` to configure
PostgreSQL, apply migrations, seed the sample catalogue, and start the API.
Then run the frontend:

```text
npm ci
npm run dev
```

## Checks

- `npm run typecheck` — strict frontend TypeScript check.
- `npm test` — Vitest unit tests.
- `npm run test:node` — typed catalogue and media checks.
- `npm run build` — optimized production build.
- `npm run test:e2e` — Playwright browser tests against a production build and
  the seeded API at `http://127.0.0.1:4100`. It verifies API product IDs, names,
  paise-to-rupee prices and images in the rendered storefront. Screenshots are
  saved under `../docs/screenshots/`.

Playwright normally starts the production frontend on port 3100. If a local
preview is already running elsewhere, set `PLAYWRIGHT_BASE_URL` to its origin.
The backend and PostgreSQL must be available for catalog routes and browser
tests.
