# Forma Furniture backend

Node.js and TypeScript commerce API. Product reads are public; customer/admin
identity, order, inventory, cart and payment capabilities belong to later phases
and are not exposed by this service.

## Local setup

Use Node.js 22.18 or later. Install from this directory with `npm ci`, copy
`.env.example` to `.env.local`, and set a local PostgreSQL `DATABASE_URL`. Keep
`.env.local` untracked. The service binds to loopback by default.

```text
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`db:seed` imports the current typed Phase 2 catalogue as sample product facts.
It is transactional and safe to repeat; each imported record is marked
`contentStatus: sample`. Product claims, measurements, materials, prices, lead
times, promotional copy and image rights still require merchant approval before
production use.

## API

- `GET /health` reports process liveness.
- `GET /ready` checks PostgreSQL connectivity.
- `GET /api/products?category=Seating&search=sunday&sort=price-asc&limit=24&offset=0`
  returns `{ items, total, limit, offset }`. Categories are Seating, Tables,
  Bedroom and Storage. Sort values are `featured`, `price-asc`, `price-desc` and
  `name`. `pricePaise` is the integer price representation.
- `GET /api/products/:id-or-slug` returns one published product or 404.

Queries use parameterized Drizzle expressions. Invalid filters/page bounds are
400; unavailable database reads return 503. Cross-origin requests are denied
unless their exact origin matches `FRONTEND_ORIGIN` (default
`http://localhost:3000`). No write/order/payment endpoint exists in this phase.

## Deployment and database operations

Provision PostgreSQL 16+ through the deployment provider before starting the
API. Supply `DATABASE_URL` through the host secret manager (never commit it).
Use a dedicated least-privilege application role and require TLS for remote
connections. Set `FRONTEND_ORIGIN` to the exact deployed storefront origin and
`PORT` to the platform-provided port. Put the API on a private network where
possible; if it is internet-facing, terminate TLS at the platform proxy and
apply platform rate limits. `GET /ready` is the readiness probe; `/health` is
process liveness only.

Apply migrations as a one-off release step, before starting the new API build:

```text
npm ci
npm run db:migrate
npm run typecheck
npm start
```

Do not run schema migrations automatically from every web worker at startup.
Drizzle migrations are forward-only here: take a provider-managed snapshot
before a production migration, review the generated SQL, and prepare a new
forward migration to correct a bad change. Verify the migration journal and
`GET /ready` after rollout. Use the provider's documented point-in-time restore
procedure for disaster recovery; periodically test restores in a separate
database. `npm run db:seed` is only for demo/development catalog data and must
not be run against production merchant records. The migration chain currently
creates the product table; no production records or backups exist in this repo.

The frontend server must be configured with `FORMA_API_URL` pointing to the
internal API origin. The Next.js server makes no-store server-side API reads;
the API origin need not be public to browsers. Do not expose database URLs or
credentials through `NEXT_PUBLIC_*` variables.

## Checks

- `npm run typecheck`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run test:integration` runs migrations, performs the idempotent sample
  seed and executes PostgreSQL-backed Node integration tests.
