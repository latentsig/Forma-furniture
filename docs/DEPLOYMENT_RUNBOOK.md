# Forma Furniture deployment runbook

This runbook defines reproducible **demo/staging** deployment only. It does not authorize production orders, payments, COD or AI processing.

## Runtime requirements

- Node.js 24.14.0 (repository packages require Node 22.18 or newer).
- PostgreSQL 16 or newer.
- Docker Desktop/Engine with Compose v2 for the containerized local staging path.
- Keep `.env.local`, `deployment/staging.env`, OAuth credentials, database URLs and MFA keys out of Git and browser bundles.

## Containerized local staging

From the repository root:

1. Copy `deployment/staging.env.example` to the ignored `deployment/staging.env`.
2. Generate staging-only values. Example in a POSIX shell:

   ```sh
   openssl rand -hex 24   # STAGING_DB_PASSWORD
   openssl rand -hex 32   # ADMIN_MFA_ENCRYPTION_KEY
   ```

   Use a separate value for each variable. Keep `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:13100` for this localhost-only demo. Do not reuse production secrets.
3. Start PostgreSQL and wait for its health check:

   ```sh
   docker compose --env-file deployment/staging.env -f compose.staging.yaml up -d postgres
   docker compose --env-file deployment/staging.env -f compose.staging.yaml ps
   ```
4. Apply migrations and seed the sample catalogue as explicit one-off commands:

   ```sh
   docker compose --env-file deployment/staging.env -f compose.staging.yaml --profile init run --rm staging-init
   ```

5. Start the API and web containers:

   ```sh
   docker compose --env-file deployment/staging.env -f compose.staging.yaml up -d backend frontend
   docker compose --env-file deployment/staging.env -f compose.staging.yaml ps
   ```

6. Smoke the stack:

   ```sh
   curl --fail http://127.0.0.1:14100/health
   curl --fail http://127.0.0.1:14100/ready
   curl --fail http://127.0.0.1:13100/api/health
   curl --fail http://127.0.0.1:13100/api/ready
   curl --fail 'http://127.0.0.1:14100/api/products?limit=100&offset=0'
   ```

The ports are loopback-only. API container binding to `0.0.0.0` is needed for the Compose network; no port is exposed on a public interface. `APP_ENV=staging`, `COD_ENABLED=false`, no delivery PINs, and sample-only seeded products prevent this from being a sellable store. The named staging database volume persists between restarts. To intentionally erase this **demo-only** database, inspect the Compose project and run `down -v` only for this stack.

## Local Windows staging using installed PostgreSQL

The recovery environment also used a separate loopback PostgreSQL database `forma_furniture_staging`. A local ignored `backend/.env.staging.local` can hold its connection string and loopback settings; do not copy credentials into docs. From `backend/`, run migrations and sample seed with:

```powershell
node --env-file=.env.staging.local --experimental-strip-types src/db/migrate.ts
node --env-file=.env.staging.local --experimental-strip-types src/db/seed.ts
node --env-file-if-exists=.env.staging.local --experimental-strip-types src/server.ts
```

The frontend must use `FORMA_API_URL=http://127.0.0.1:<API-port>` and `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:<web-port>`. In production `FORMA_API_URL` must be explicitly configured and cannot be localhost/loopback. The web `/api/ready` endpoint checks both backend readiness and PostgreSQL connectivity.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It creates a disposable PostgreSQL 16 service, installs both lockfiles using `npm ci`, typechecks, runs Node/backend and frontend tests, runs migrations and sample seed, builds the frontend, starts the API and runs Playwright against a production build. CI-only credentials are fixtures, not deployment credentials. A failed test or readiness probe fails the workflow.

## Vercel + separate API deployment

The repository does not contain a Vercel account, API hosting account or production secrets. To verify a hosted staging deployment:

1. Set Vercel root directory to `frontend`, use Node 24.14.0, install with `npm ci`, and build with `npm run build`.
2. Configure server-only `FORMA_API_URL` to the HTTPS API origin reachable from the Vercel runtime. Never use `127.0.0.1`, `localhost`, or a `NEXT_PUBLIC_*` API secret for a separate service.
3. Configure `NEXT_PUBLIC_SITE_URL` to the actual HTTPS staging storefront origin (build-time metadata setting).
4. Deploy the Node API as a persistent service with PostgreSQL 16+, TLS/managed private networking and `GET /ready` health check. Set explicit `HOST` and platform `PORT`, exact HTTPS `FRONTEND_ORIGIN` and `CUSTOMER_APP_ORIGIN`, `DATABASE_URL`, and a managed 32-byte hex `ADMIN_MFA_ENCRYPTION_KEY` in the host secret store.
5. Run reviewed Drizzle migrations as a one-off release step before the API rollout. Seed only an isolated demo/staging database; never run `db:seed` against merchant/production records.
6. Verify API `/health`, API `/ready`, web `/api/health`, web `/api/ready`, catalogue count and direct browser route refreshes. Save the deployment SHA and evidence.

The backend defaults to `127.0.0.1` for local development. For production it refuses startup without explicit `HOST`, valid port, HTTPS origins and MFA key. For same-host local reverse proxy use loopback; for a separate container or platform service set the explicit network bind while restricting ingress at the service/network layer.

## Windows Playwright notes

Run from a clean checkout with `npm ci` in `frontend/` so package resolution is local to the checkout drive; do not use the shared `node_modules` junction used by the original desktop preview. Ensure the API is already running and `/ready` passes before `npm run test:e2e`. The Playwright `webServer` waits for frontend `/api/ready`, uses one worker, and stores screenshots/traces under ignored `frontend/test-results/` without overwriting committed evidence. `npm run start` validates environment configuration and prepares Next standalone static/public assets before starting `server.js`. On Windows, this environment returned `EPERM` when sandboxed Vitest/Playwright tried to spawn worker processes; those same checks passed when executed outside the sandbox. Do not convert a sandbox worker error into a test pass: rerun outside that sandbox or use CI and record which environment produced the evidence.

## Rollback and secrets

- Keep production migrations additive and reviewed; capture managed DB backup/snapshot before production migration.
- Roll back application image to the last known-good immutable SHA. Do not roll back a database by dropping tables; prepare a forward migration for schema correction.
- Use provider secret managers. Rotate the OAuth secret previously exposed in chat before production. Do not paste secrets into issues, PR descriptions, docs or chat.
- Production remains blocked on merchant product/SKU, image rights, inventory, delivery and COD policy approval; separate payment gateway onboarding; verified email/OAuth; and DevOps backup, monitoring and rollback evidence.
