# DispatchPilot

DispatchPilot is a single-company field-service operations platform. Managers,
dispatchers, and technicians will use it to coordinate service work. This
branch contains only the foundation: authentication, roles, API conventions,
logging, OpenAPI, database scaffolding, and an empty authenticated UI shell.
DispatchPilot domain features are intentionally not implemented yet.

## Stack

- React 19, Vite, TanStack Router and Query, shadcn/ui, Phosphor Icons
- Hono on Node.js 24, Better Auth, Drizzle ORM, PostgreSQL/Neon
- Zod schemas in `packages/shared`
- Google Cloud Run target; pnpm 11.23.0

## Prerequisites

- Node.js 24.x
- pnpm 11.23.0
- PostgreSQL for backend runtime and tests

## Setup

```bash
pnpm install
cp apps/back-end/.env.example apps/back-end/.env
cp apps/front-end/.env.example apps/front-end/.env
pnpm typecheck
pnpm lint
pnpm build
```

Do not commit either `.env` file. Set `DATABASE_URL`, `TEST_DATABASE_URL`, the
Better Auth URLs, and a 32-character `BETTER_AUTH_SECRET` in the backend
environment. The frontend can use an empty `VITE_API_URL` during local
development because Vite proxies `/api`.

The development seed reads these backend variables: `SEED_MANAGER_EMAIL`,
`SEED_MANAGER_NAME`, `SEED_MANAGER_PASSWORD`, `SEED_DISPATCHER_EMAIL`,
`SEED_DISPATCHER_NAME`, `SEED_DISPATCHER_PASSWORD`, `SEED_TECHNICIAN_EMAIL`,
`SEED_TECHNICIAN_NAME`, and `SEED_TECHNICIAN_PASSWORD`. Auth integration tests
also require `TEST_AUTH_EMAIL` and `TEST_AUTH_PASSWORD`.

Database changes are tracked in `apps/back-end/drizzle`. Confirm that the test
URL points to a disposable database different from `DATABASE_URL` before using
it. Run migrations and seeds only against the intended test database:

```bash
DATABASE_URL="$TEST_DATABASE_URL" pnpm --filter @dspv2/backend db:migrate
DATABASE_URL="$TEST_DATABASE_URL" pnpm --filter @dspv2/backend seed
```

The seed creates exactly one Better Auth credential user for each of the three
roles and is idempotent. It never changes an existing password. Never run it
against production.

The frontend currently uses deterministic demo data. Set
`VITE_USE_MOCK_DATA=false` when wiring the future API adapter; until that
adapter exists, the UI remains on the mock adapter. Demo mode is visibly marked
in the authenticated top bar. The seeded role accounts are documented in the
local, ignored `credentials.md` file.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Backend API documentation is available at `/docs` (Scalar) and
`/openapi.json`. Health endpoints are `/api/v1/health` and
`/api/v1/ready`.

## Layout

```text
apps/back-end/       Hono API, Better Auth, Drizzle schema and migrations
apps/front-end/      React/Vite app, auth routes and UI foundation
packages/shared/     Roles, Zod schemas and API error types
docs/                PRD, implementation plan and SRS
```

See [PRD](docs/PRD.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md),
and [SRS v2](docs/DispatchPilot_SRS_REVISED.pdf) for planned product scope.

## UI verification

The dashboard and login layouts use the light green theme. Screenshot
verification is not recorded in this environment: no browser or screenshot
runner was available, and the referenced
`docs/design/reference-dashboard.png` file was not present.

### Google sign-in and password reset

Google sign-in is optional. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
in the backend environment to enable the existing-user-only provider. Register
these redirect URIs in Google Cloud Console:

- Local: `http://localhost:3001/api/auth/callback/google`
- Production: `https://<your-cloud-run-service-domain>/api/auth/callback/google`

The reset flow uses Better Auth. In development, or with `DRY_RUN=true`, the
reset URL is logged by the backend adapter; no email provider is bundled yet.
