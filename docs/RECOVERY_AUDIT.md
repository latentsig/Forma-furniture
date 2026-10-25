# Forma Furniture recovery audit

**Date:** 2026-10-25
**Merged baseline:** `origin/main` at `cc0bf7641403ebbe0656dd8ada62251ecee9455c` (PR #1).
**Recovery branch:** `recovery/r0-r1-staging`, created from that exact ref.
**Scope:** R0 source/configuration audit and R1 local staging/deployment foundation. This is not production acceptance.

## Repository reconciliation

- Before recovery edits, the worktree was clean on `phase-4-auth-admin-rbac` at `5a49359`; the remote feature branch matched. No uncommitted tracked or untracked source files needed preservation.
- `git fetch origin main phase-4-auth-admin-rbac` advanced `origin/main` from `9de7362` to `cc0bf76`. `cc0bf76` is the merge commit for PR #1; its second parent is `5a49359`, the feature branch inspected earlier. The working tree was then branched from `origin/main` without reset, stash or cleanup.
- The earlier local audit note about pending Phase 4–8 files was stale after PR #1 merged. Phase 4–8 statuses remain gated in [`PHASE_STATUS.md`](PHASE_STATUS.md).

## Route, API and data inventory

| Surface | Current routes / service | Evidence-based behavior and limits |
|---|---|---|
| Public storefront | `/`, `/collections`, `/product?id=…`, `/spaces`, `/craft`, `/journal`, `/visit` | Next.js server-rendered TypeScript routes consume the PostgreSQL catalogue through the Node API. Existing legacy `.html` paths redirect. Product prices and content are explicitly sample data. |
| Customer identity | `/account`; BFF `/api/customer/*`; backend `/api/customers/*` | Registration, login, profile, email verify/reset, session, Google ID token and Facebook authorization-code entry points exist. Email delivery/social providers require external configuration; not verified as live integrations. |
| Cart / checkout | storefront cart drawer; BFF `/api/commerce/*`; backend `/api/commerce/*` | Persistent guest/customer cart, quotes, consent snapshot and transactional COD order logic exist. COD remains disabled, and current sample products have no sellable stock. No gateway payment is connected. |
| Administration | `/admin`, `/admin/setup`, `/admin/accept-invite`; BFF `/api/admin/*`; backend `/api/admin/*` | Owner bootstrap, password+TOTP sign-in, invitations, RBAC, catalogue edits/import/approval, audit reads and order views exist. One-time setup and email delivery depend on explicit local or operator configuration. |
| Operational endpoints | Frontend `/api/health` and `/api/ready`; backend `/health` and `/ready` | Backend `/ready` checks PostgreSQL. The new frontend `/api/ready` composes the API and database readiness result; `/api/health` remains frontend liveness only. |
| Media | `/media/[...path]` | Serves only files under the configured asset root and rejects invalid traversal; original catalogue image assets remain in the repository. |

Backend API groups inspected in `backend/src/server.ts`:

- Public catalogue: `GET /api/products`, `GET /api/products/:id-or-slug`.
- Customer: register, login, session read/delete, email verification and reset, profile, Google nonce/token and Facebook identity endpoints.
- Commerce: cart read/clear/line update, delivery quote, COD order create, customer order history, staff order list/cancel. These are DB-backed, but merchant gates prevent a sellable COD journey in the current sample database.
- Admin: bootstrap, sessions, password/access recovery, invitations, staff, product list/create/edit/import/approve, inventory and audit. Server permissions enforce role checks.

## Findings and recovery fixes

1. **Merged-source startup blocker:** `backend/src/auth/customer-service.ts` was syntactically invalid: `validateCustomerPassword` lacked its closing brace, so Node failed with `ERR_INVALID_TYPESCRIPT_SYNTAX` before the API could start. Corrected on this branch and covered by backend typecheck and stack startup checks. The defect entered the preceding feature commit during a whitespace-only edit; the recovery branch contains the correction.
2. **Frontend remote API failure:** catalogue reads and all customer/admin/commerce BFF handlers silently fell back to `http://127.0.0.1:4100`. Loopback is only valid for a same-machine local development API; in Vercel or a separate container it points back to the frontend instance. A server-only resolver now permits this fallback only outside production and requires an explicit non-loopback `FORMA_API_URL` in production. Frontend startup validates required deployment origins. Docker staging uses service DNS `http://backend:4100`.
3. **Backend binding failure:** the API always listened on `127.0.0.1`, inaccessible to a separate frontend container/service. It now defaults to loopback locally; production requires an explicit `HOST`, with staging compose binding `0.0.0.0` inside its isolated network and host ports restricted to loopback. Production startup validates port, HTTPS frontend/customer origins and the MFA encryption key.
4. **No deployment repeatability:** merged `main` had no committed workflow, Dockerfiles or staging compose. R1 adds PostgreSQL 16 staging compose, multi-stage images, sample-only initialization, health checks and CI. The CI PostgreSQL fixture is isolated and test-only.
5. **No composed readiness check:** frontend `/api/health` previously showed only that Next.js answered. `/api/ready` now fails closed unless the backend and PostgreSQL both report ready; Playwright uses that URL before browser tests.
6. **Windows EPERM:** the provided environment had frontend packages linked into a shared C: dependency tree and a backend `node_modules` junction. Vite's Windows realpath subprocess and Node's default test-file worker spawning returned `EPERM`. Backend Node tests are configured for same-process test isolation and direct execution for the config test; frontend install was attempted on D: to remove the dependency junction, but D: ran out of space. The new CI executes clean installs/tests on Ubuntu. Local Windows browser results are recorded separately in the final report: no such failure is suppressed as a pass.
7. **Incomplete primary journeys (not changed in R1):** Buy Now currently calls the same `add` action as Add to bag and does not navigate to checkout. The customer has no standalone `/cart`, `/checkout`, or order detail URL; the cart and checkout are drawer states. Inquiry is a preview and does not submit to an inbox. Product URLs use `/product?id=…`. These are ranked in [`DEMO_ACCEPTANCE.md`](DEMO_ACCEPTANCE.md), not represented as payment or order acceptance.

## Route and test inventory

- Browser routes and flows are in `frontend/e2e/storefront.spec.ts`: responsive home/collection, search/filter/sort, product gallery/zoom, cart persistence and sign-in gate, legacy redirects, public/account/admin pages, admin recovery/setup/invitation, API proxy same-origin protection and health checks.
- Backend integration/security tests: `backend/src/integration.test.ts`, `backend/src/auth/security.test.ts`, `backend/src/auth/facebook-auth.test.ts`, `backend/src/commerce/service.test.ts`.
- Database schema and migration journal: `backend/src/db/schema.ts`, `backend/drizzle/0000`–`0010` and `_journal.json`; catalog seed marks all 100 imported records `contentStatus: sample`.
- Frontend unit/node tests: `frontend/src/catalog.test.ts`, `frontend/src/catalog.node.test.ts`; payment/fulfillment/AI files only test provider-neutral or policy-gated domain primitives.

## Environment evidence and limits

- Observed tools: Node `v24.14.0`, npm `11.14.1`, PostgreSQL `16.15`. PostgreSQL Windows service is running.
- A new local database `forma_furniture_staging` was created only after verifying the configured database host was loopback. Drizzle migrations applied and the existing 100-product sample catalogue seeded. COD remains false; no approved inventory or real merchant product was added.
- API smoke evidence after the syntax correction: `GET /health` 200; `GET /ready` 200 with database connected; product list 200 with 100 sample rows; unknown product 404.
- Backend strict TypeScript check passed. Runtime config tests passed 2/2; payment foundation tests 3/3; fulfillment guard tests 3/3; AI validation guard tests 4/4. PostgreSQL integration/auth/commerce suite passed 23/23 (0 failed, 0 skipped) on the isolated staging DB. Its initial run was 22/23 because the test expected CORS origin `http://localhost:3000` while the staging process used another origin; rerun with the test's expected origin passed all cases.
- Docker CLI is installed but Docker Desktop's Linux engine is not available (`docker info` could not connect to its named pipe). Therefore compose image builds and compose health checks cannot be executed in this environment until the Docker daemon is available.
- A frontend `npm ci` attempt to replace the shared dependency links on D: stopped with `ENOSPC`; the partial generated `frontend/node_modules` directory was removed after verifying it was a normal in-workspace directory, freeing space. This did not touch source files. Frontend production-build and browser test evidence is pending a same-drive clean validation checkout with sufficient free space.
- No Vercel deployment credentials/domain or hosted staging URL were provided to this workspace. A hosted deployment and remote web-to-API verification cannot be claimed. Local staging verification is distinct from hosted acceptance.
- Existing ignored local environment files were not printed or committed. No production credentials were copied into the demo environment. Rotate any OAuth secret previously shared in chat before production use.
