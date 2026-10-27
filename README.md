# Forma Furniture

Forma is a TypeScript furniture storefront with a Next.js frontend, a Node.js commerce API, PostgreSQL persistence, and a local Docker Compose staging stack.

> **Demo and staging only.** The catalogue contains sample product information. It is not approved for sale. Production checkout, live payments, COD collection, and production image processing are not enabled. See [Phase status](docs/PHASE_STATUS.md) before treating any feature as production-ready.

## What is in the repository

- Responsive furniture storefront with collection browsing, product details, search, filters, sorting, and image galleries.
- Customer account and administrator routes with role-based controls and MFA foundations.
- TypeScript API backed by PostgreSQL and Drizzle migrations.
- Sample catalogue seeding and automated unit, integration, and browser checks.
- A Docker Compose staging environment with PostgreSQL, API, and web services.

## Technology

| Area | Stack |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript |
| API | Node.js 24, TypeScript, HTTP services |
| Data | PostgreSQL 16+, Drizzle ORM and SQL migrations |
| Local staging | Docker Compose v2 |
| Verification | TypeScript, Vitest, Node test runner, Playwright |

## Requirements

- Node.js **24.14.0** (the backend requires Node.js 22.18 or newer).
- npm, installed with Node.js.
- Docker Desktop or Docker Engine with Compose v2 for the recommended local staging setup.
- For separate local development: PostgreSQL 16 or newer.

## Quick start: local staging with Docker

Run these commands from the repository root. This creates an isolated local demo database and binds the web and API ports to loopback only.

### 1. Create local staging settings

PowerShell:

```powershell
Copy-Item deployment/staging.env.example deployment/staging.env
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
```

Put the first generated value in `STAGING_DB_PASSWORD` and the second in `ADMIN_MFA_ENCRYPTION_KEY` in `deployment/staging.env`. Keep this ignored local file private; do not commit it or reuse these values in production.

macOS/Linux:

```sh
cp deployment/staging.env.example deployment/staging.env
openssl rand -hex 24 # STAGING_DB_PASSWORD
openssl rand -hex 32 # ADMIN_MFA_ENCRYPTION_KEY
```

Put the generated values in the matching entries in `deployment/staging.env`.

### 2. Start PostgreSQL and prepare sample data

```sh
docker compose --env-file deployment/staging.env -f compose.staging.yaml up -d postgres
docker compose --env-file deployment/staging.env -f compose.staging.yaml ps
docker compose --env-file deployment/staging.env -f compose.staging.yaml --profile init run --rm staging-init
```

The one-off `staging-init` service applies database migrations and inserts the sample catalogue. Run it only against this disposable staging database.

### 3. Start the API and storefront

```sh
docker compose --env-file deployment/staging.env -f compose.staging.yaml up -d --build backend frontend
docker compose --env-file deployment/staging.env -f compose.staging.yaml ps
```

Open:

- Storefront: <http://127.0.0.1:13100>
- Collections: <http://127.0.0.1:13100/collections>
- Account: <http://127.0.0.1:13100/account>
- Admin: <http://127.0.0.1:13100/admin>
- API health: <http://127.0.0.1:14100/health>
- API and database readiness: <http://127.0.0.1:14100/ready>
- Web and dependency readiness: <http://127.0.0.1:13100/api/ready>

Stop the containers while keeping the staging database volume:

```sh
docker compose --env-file deployment/staging.env -f compose.staging.yaml down
```

`down -v` removes the staging database volume and its data. Use it only when you intend to reset this local demo database.

## Run the applications separately

Use this path if you already have PostgreSQL running locally. Create the ignored files `backend/.env.local` and `frontend/.env.local` from their respective `.env.example` files. Configure the backend database URL, loopback host, API port, and frontend origin. For the frontend, set `FORMA_API_URL=http://127.0.0.1:4100` and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

In one terminal:

```sh
cd backend
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. The API listens on <http://127.0.0.1:4100>. The seed command creates demo data; never run it against a production database.

## Useful commands

Run commands from the relevant package directory.

| Package | Command | Purpose |
| --- | --- | --- |
| `backend/` | `npm run typecheck` | TypeScript check |
| `backend/` | `npm run test:runtime-config` | Runtime configuration tests |
| `backend/` | `npm run test:payments` | Payment-domain guard tests |
| `backend/` | `npm run test:fulfillment` | Fulfillment-domain guard tests |
| `backend/` | `npm run test:ai-imagery` | AI imagery validation tests |
| `backend/` | `npm run test:integration` | Migrate, seed, and run PostgreSQL-backed tests |
| `frontend/` | `npm run typecheck` | TypeScript check |
| `frontend/` | `npm test` | Frontend unit tests |
| `frontend/` | `npm run test:node` | Node-based catalogue tests |
| `frontend/` | `npm run build` | Production frontend build |
| `frontend/` | `npm run test:e2e` | Playwright browser checks |

The PostgreSQL-backed integration and browser tests need the API and database configuration described in [the deployment runbook](docs/DEPLOYMENT_RUNBOOK.md). CI runs the complete verification pipeline on GitHub Actions.

## Configuration and security

- Copy `.env.example` files to ignored local `.env.local` files. Never commit real credentials, database URLs, OAuth secrets, or MFA keys.
- Use separate credentials and databases for local, staging, and production environments.
- The backend binds to loopback for local development. Hosted/container deployments must explicitly configure `HOST` and restrict service ingress appropriately.
- In hosted production, `FORMA_API_URL` must point to the reachable API origin; a container's `localhost` is not a substitute for the API service address.
- Staging sets `COD_ENABLED=false` and has no delivery PIN coverage. This project does not currently accept live online payments.
- Customer-uploaded room images and public product images have different privacy requirements; do not put private customer photos in a public bucket.

## Documentation

- [Deployment runbook](docs/DEPLOYMENT_RUNBOOK.md): local staging, hosted setup, CI, and recovery procedures.
- [Demo acceptance](docs/DEMO_ACCEPTANCE.md): current demo feature matrix and journey backlog.
- [Recovery audit](docs/RECOVERY_AUDIT.md): repository and deployment recovery findings.
- [Phase status](docs/PHASE_STATUS.md): implementation state, evidence, and production blockers.

## Production readiness

The presence of an implementation or a passing local test does not mean the storefront is approved to sell. Production acceptance still depends on merchant-approved product facts and images, real inventory and delivery rules, verified authentication and email configuration, service hosting, operational monitoring and backups, and any payment gateway onboarding. Review [the phase status](docs/PHASE_STATUS.md) and [demo acceptance](docs/DEMO_ACCEPTANCE.md) for the current evidence and blockers.
