# Forma Furniture backend

Node.js and TypeScript commerce API. Public product reads and protected staff
authentication/catalog administration are implemented. Customer accounts,
orders, inventory, cart and payment capabilities belong to later phases.

## Local setup

Use Node.js 22.18 or later. Install from this directory with `npm ci`, copy
`.env.example` to `.env.local`, and set a local PostgreSQL `DATABASE_URL` plus
a random 32-byte hex `ADMIN_MFA_ENCRYPTION_KEY`. Keep `.env.local` untracked and
back up the MFA encryption key in the deployment secret manager. Losing or
changing the key without re-encrypting stored secrets prevents administrators
from signing in. The service binds to loopback by default.

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

- `POST /api/customers/register`, `/login`, `/verify-email`,
  `/request-email-verification`, `/forgot-password`, `/reset-password`,
  `/google`, `/facebook`, `GET` and `DELETE /api/customers/session`, and
  `PATCH /api/customers/profile` implement customer identity and profile flows.
  Email verification and password reset tokens are random, hashed in
  PostgreSQL, short-lived and single-use. Password reset revokes all existing
  sessions. Customer sessions are opaque, hashed in PostgreSQL and expire in
  30 days. Google identity tokens are verified server-side against Google's
  rotating RSA signing keys, configured audience, issuer, expiry, verified
  email and the browser flow's nonce.
- `GET /api/admin/bootstrap/status`, `POST /api/admin/bootstrap/begin` and
  `/complete` support the local first-owner setup only when
  `ADMIN_LOCAL_SETUP_ENABLED=true`, the API is not in production, it receives a
  loopback request and no administrator exists. Pending setup data is held only
  in short-lived process memory. Production has no public admin registration;
  use the owner bootstrap CLI instead.

- `POST /api/admin/session`, `GET /api/admin/session` and
  `DELETE /api/admin/session` create, validate and revoke staff sessions.
- `GET /api/admin/products`; `POST /api/admin/products`; `PATCH` and `DELETE`
  `/api/admin/products/:id`; and `POST /api/admin/products/:id/approve` provide
  role-protected catalog operations. Delete means soft unpublish. Product edits
  and approvals are recorded in the audit table in the same transaction.
- `POST /api/admin/products/import/preview` validates CSV without writes;
  `/commit` revalidates and transactionally creates sample/unpublished drafts.
- Owner-only `GET /api/admin/staff` and `PATCH /api/admin/staff/:id` list,
  update roles and disable staff accounts. Owners onboard people through
  `GET`/`POST /api/admin/invitations` and `DELETE
  /api/admin/invitations/:id`; invitations expire after 24 hours and can be
  cancelled. Each invitee chooses their own password and enrolls their own
  required TOTP authenticator on the one-time `/admin/accept-invite` flow.
  Email delivery requires Resend and a verified sender outside local preview.
- `GET /api/admin/audit` returns latest audit entries to OWNER/ANALYST.

The Next.js same-origin BFF at `/api/admin/*` keeps the opaque API session token
in an HttpOnly, SameSite=Strict cookie and rejects cross-origin writes. Never
expose bearer tokens to browser JavaScript. Staff roles are OWNER,
CATALOG_MANAGER, ORDER_MANAGER, SUPPORT and ANALYST; grants are checked in the
API. OWNER is required for merchant approval, publication, staff management
and audit access. Catalog managers can edit/create/import but cannot
approve/publish. Passwords use Node scrypt; TOTP MFA is required at each staff
sign-in and encrypted at rest with AES-256-GCM. Session tokens are hashed in
PostgreSQL, expire after eight hours, and are revoked when an account is
disabled. Five failed account attempts lock sign-in for fifteen minutes; an
additional per-IP in-process throttle allows ten attempts per minute.

Bootstrap the first owner once, after migrations. Generate a unique random
base32 TOTP secret externally, set the owner email/password/secret and current
six-digit authenticator code in the untracked `.env.local`, then run
`npm run admin:bootstrap-owner`. The command refuses to run if any admin exists
and does not print credentials. Remove bootstrap variables from the environment
afterward. The owner chooses each invitee's email and least-privilege role; the
invitee privately scans their own QR code and verifies a six-digit TOTP during
account activation. The default local environment has no owner account or
credentials.

Queries use parameterized Drizzle expressions. Invalid filters/page bounds are
400; unavailable database reads return 503. Cross-origin requests are denied
unless their exact origin matches `FRONTEND_ORIGIN` (default
`http://localhost:3000`). No customer-account, order or payment endpoint exists
in this phase.

Customer email verification and recovery require either `RESEND_API_KEY` and a
verified `AUTH_EMAIL_FROM`, or the explicit local-only `AUTH_LOCAL_DEV_LINKS`
flag. Google login requires `GOOGLE_CLIENT_ID` in the backend and both
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the frontend server
environment. The OAuth redirect must be registered as
`https://your-domain.example/api/customer/google/callback`. None of these
provider secrets belong in browser code. `/account` is a customer route; it does
not create a staff account or grant admin privileges.

Facebook customer login uses the server-side authorization-code flow. In Meta
for Developers, create a Facebook Login for Web app, add the exact configured
`FACEBOOK_REDIRECT_URI` to Valid OAuth Redirect URIs, and allow the `email` and
`public_profile` scopes. Set `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`,
`FACEBOOK_GRAPH_VERSION`, and `FACEBOOK_REDIRECT_URI` in the backend server
environment; set the app ID, Graph version and same redirect URI in the
frontend server environment. For the current local review preview on port 3106,
the callback is `http://127.0.0.1:3106/api/customer/facebook/callback`;
production must use
the canonical HTTPS origin. New Facebook profiles remain email-unverified
until the signed-in customer uses the verification email flow. Existing email
accounts are not automatically linked; sign in to the existing account first.

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
  seed and executes PostgreSQL-backed Node integration/security tests.

The per-IP throttle is process-local in this phase; a production multi-worker
deployment must replace it with a shared gateway/store rate limiter. Admin audit
entries currently have no approved expiry policy and are retained indefinitely.
No owner account is provisioned by the demo seed.
