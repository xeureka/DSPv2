# DispatchPilot scaffold cleanup report

## 1. Removed

- 135 tracked files were deleted across the clinic implementation, including
  clinic routes, pages, services, repositories, payment/Chapa code and tests,
  tenancy/RLS code, mobile/Expo code, OTP/SMS code, demo data, old migrations,
  and stale app lockfiles.
- Direct dependencies removed include `@better-auth/expo`, `aws4fetch`,
  `postgres`, `resend`, Capacitor Android/CLI/core, `lucide-react`, `cn`, and
  the unused Biome dependency. The root-only Bun, Drizzle, Zod, and stale
  mobile scripts/dependencies were also removed or relocated to their owning
  workspace.
- The old DSPV2/CRM health-check script, `scaler-handler.ts`, unused
  `require-auth.middleware.ts`, duplicate CORS middleware, and simulator
  placeholder were removed.

## 2. Kept or adapted

| Bucket | Result |
| --- | --- |
| KEEP | Hono app composition, secure headers, CORS, rate limiting, request IDs, structured logging, redaction, `AppError`, centralized responses, OpenAPI and Scalar, Better Auth, Drizzle, Query client, TanStack Router guard structure, API client shape, and generic error UI. |
| ADAPT | Better Auth now uses cookie sessions and a direct `createAuthClient`; roles are `manager`, `dispatcher`, and `technician`; schemas and the error envelope are shared from `packages/shared`; the UI is shadcn/ui with Phosphor Icons and light/dark tokens; health/readiness routes and tracked Drizzle migration were added. |
| REMOVE | Clinic domain, tenancy, payments, notifications, OTP/SMS, mobile/Expo, demo pages/data, old icon library, organization machinery, and startup migration behavior. |

No DispatchPilot jobs, planner, SLA, simulator, Gemini, requester-token, or
integration features were added.

## 3. Checks

Successful checks run:

- Shared: `../../node_modules/.bin/tsc --noEmit -p packages/shared/tsconfig.json`
- Backend typecheck: `../../node_modules/.bin/tsc --noEmit -p apps/back-end/tsconfig.json`
- Backend lint: `./node_modules/.bin/oxlint src` from `apps/back-end`
- Backend build: esbuild Node 24 bundle to `/tmp/dispatchpilot-backend.js`
- Frontend typecheck: `./node_modules/.bin/tsc -b tsconfig.json` from `apps/front-end`
- Frontend lint: `./node_modules/.bin/oxlint src` (exit 0; three Fast Refresh warnings remain in generated/shared-export files)
- Frontend build: `./node_modules/.bin/vite build` (passed)
- Formatting: `oxfmt --check` over the changed workspace code/config files (passed)
- Root TypeScript project reference check: `./node_modules/.bin/tsc -b` (passed after the root config was reduced to the shared project reference)
- Frontend test command: `node --test` (0 tests, exit 0)

Backend foundation tests produced 3 passes and 1 expected failure:

```text
node --import tsx --test "src/**/*.test.ts"
pass: 3, fail: 1
```

The failing test is the Better Auth sign-in smoke test because
`TEST_DATABASE_URL`, `TEST_AUTH_EMAIL`, and `TEST_AUTH_PASSWORD` are not set.
No migration, seed, or database query was run against any database.

The root `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test` commands
were invoked, but pnpm could not execute them in this environment because its
Corepack store returned `ERR_SQLITE_ERROR: unable to open database file` and
attempted an automatic dependency install. The equivalent app-level checks
above were run directly. The installed Drizzle Kit generation command was also
attempted and exited 1 with its “version is outdated” message; the initial
tracked migration was therefore prepared from the reduced schema and must be
validated by `db:migrate` on the disposable test database.

The backend could not start for runtime verification: its existing local
environment failed validation for `DATABASE_URL`, `BETTER_AUTH_SECRET`, and
`BETTER_AUTH_URL`. Consequently Scalar, health/readiness, and role sign-in
smoke checks were not claimed as passed.

## 4. Resulting structure

```text
.
├── apps
│   ├── back-end
│   │   ├── drizzle/                 tracked initial migration
│   │   └── src/                     Hono, auth, errors, logging, health, tests
│   └── front-end
│       ├── src/components/ui/       shadcn/ui + Phosphor foundation
│       └── src/routes/              login and authenticated empty shell
├── packages/shared/                 Zod roles and API error envelope
├── docs/                             PRD, plan, SRS, and this report
├── Dockerfile
└── .github/workflows/ci.yml
```

## 5. Uncertainties and follow-up

- Provide a disposable `TEST_DATABASE_URL` plus test credentials before the
  migration, seed, auth sign-in, and runtime Scalar verification can be run.
- The migration should be applied once to that disposable database and checked
  against the installed Better Auth adapter's exact UUID/string expectations.
- The three lint warnings are generated-component/export-boundary warnings,
  not build failures; they can be cleaned up when the first real navigation
  modules are added.
- Root scripts are correct in the committed package metadata, but their final
  frozen-install verification still depends on fixing the local Corepack store
  permission issue.
