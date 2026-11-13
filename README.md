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

Do not commit either `.env` file. Set `DATABASE_URL`, Better Auth URLs and a
32-character `BETTER_AUTH_SECRET` in the backend environment. The frontend can
use an empty `VITE_API_URL` during local development because Vite proxies `/api`.

Database changes are tracked in `apps/back-end/drizzle`. Run migrations only
against the intended database:

```bash
pnpm --filter @dspv2/backend db:migrate
pnpm --filter @dspv2/backend seed
```

The seed requires development credentials in the backend environment. Never
run it against production.

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
