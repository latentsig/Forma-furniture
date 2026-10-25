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

The staff console is at `/admin`. It requires an owner-provisioned staff
account, password and authenticator code; the demo seed creates no login. Staff
requests pass through a same-origin TypeScript route handler, which keeps the
backend bearer session in an HttpOnly cookie. Never put admin tokens or backend
secrets in browser storage or `NEXT_PUBLIC_*` configuration.

The customer account page is at `/account`. It supports name, email, optional
phone, verified email/password registration, sign-in, profile edits, password
reset, Google sign-in and Facebook sign-in. Customer credentials and sessions are stored in
PostgreSQL; sessions are opaque, stored as token digests, and held in an
HttpOnly cookie in the browser. Customer passwords are never used for admin
access. Native app UI is a later phase and will use the customer API rather than
the browser cookie.

For local customer verification/reset flows, set `AUTH_LOCAL_DEV_LINKS=true`
only in the untracked backend `.env.local`; the page then exposes a local test
link instead of sending email. For non-local use, configure `RESEND_API_KEY`, a
verified `AUTH_EMAIL_FROM`, and `CUSTOMER_APP_ORIGIN` in the backend secret
store. Google sign-in requires the server-only `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` in the frontend environment and the same client ID in
the backend. Add the exact redirect URI
`https://your-domain.example/api/customer/google/callback` to that Google OAuth
web client. Secrets must stay server-side. Until configured, the Google button
explains that sign-in is not connected. Facebook sign-in requires
`FACEBOOK_APP_ID`, `FACEBOOK_GRAPH_VERSION`, and `FACEBOOK_REDIRECT_URI` in the
frontend server environment and the same app ID, Graph version and redirect
URI plus `FACEBOOK_APP_SECRET` in the backend environment. Register that exact
callback URL in Meta Login settings and enable the email permission. The
Facebook secret never enters the frontend. Facebook identity email is treated
as unverified; the account page offers a verification email. Existing email
accounts are not automatically linked.

For the first local admin, set `ADMIN_LOCAL_SETUP_ENABLED=true` in the ignored
backend `.env.local`, then visit `/admin/setup` while the backend is local and
the admin table is empty. Choose the owner's email and password in that form,
then scan the on-screen QR code with Google Authenticator, Microsoft
Authenticator or another TOTP app. The QR is generated in the browser using
the returned `otpauth://` URI; it is not sent to a QR-code website. If setup is
on the same phone, enter the displayed setup key manually. The authenticator
must produce a six-digit, time-based code. An expired setup returns to the
password form so a fresh setup key can be generated. Setup is loopback-only and
automatically closes after the first owner.
Production intentionally has no public setup/sign-up route; keep that flag off
and bootstrap it with
the documented one-time CLI using an operator-controlled environment and
managed encryption key. Never send an admin password or MFA code in chat.

After signing in as OWNER, use “Invite a staff member” to enter each person's
email and role. With local development links enabled, the page displays a
one-time link to share privately; in production, invitations are emailed via
the configured Resend sender. The invitee opens `/admin/accept-invite`, chooses
their own password, scans the private QR using an authenticator app, then types
the app's current six-digit code. An eight-digit code is not accepted: if the
app shows eight digits, remove that authenticator entry and rescan the QR (or
manually add the setup key as a time-based, six-digit account). Owners can
cancel pending invitations and later disable or change roles for staff.

Playwright normally starts the production frontend on port 3100. If a local
preview is already running elsewhere, set `PLAYWRIGHT_BASE_URL` to its origin.
The backend and PostgreSQL must be available for catalog routes and browser
tests.
