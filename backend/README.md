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

## Checks

- `npm run typecheck`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run test:integration` runs migrations, performs the idempotent sample
  seed and executes PostgreSQL-backed Node integration tests.
