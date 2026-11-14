
# DispatchPilot foundation decisions

- The clinic implementation is a source template only; clinic routes, domain
  modules, payments, notifications, OTP/SMS, mobile code, and demo data are
  removed before DispatchPilot feature work begins.
- DispatchPilot is single-company. Tenant tables, RLS, tenant context,
  tenant headers, organization/membership machinery, and super-admin flows are
  excluded.
- Staff roles are exactly `manager`, `dispatcher`, and `technician`, stored as
  a role field on the Better Auth user. Requester private-link tokens are a
  later feature and do not require accounts.
- Better Auth uses its installed cookie-session client on the frontend. No
  custom auth wrapper or localStorage token is retained.
- Node.js 24.x and pnpm 11.23.0 are the supported versions because Node 24 is
  the local LTS runtime and is supported by the Cloud Run base image. The
  backend build target and CI use Node 24.
- Database changes use tracked Drizzle migrations. Application startup never
  runs migrations or schema pushes.
- The UI uses shadcn/ui generated through its CLI, Tailwind v4 theme tokens,
  and Phosphor Icons. No other icon library is used.
- Shared Zod schemas and types live in `packages/shared` so the backend and
  frontend consume the same role and API error definitions.
- Gemini, Google OAuth, scheduler secrets, and dry-run behavior are documented
  as planned environment variables but are not implemented in this foundation.

## UI shell and login decisions

- The UI palette is the first-commit design direction extended into a complete
  green system: light background `#ECFDF5`, surface `#F7FEFA`, border
  `#CFE8DA`, text `#123026`, muted text `#527066`, and primary `#15803D`.
  Dark mode uses `#071A12`, `#0D2619`, `#1C4A30`, `#E8F5EC`, `#A5C7B0`, and
  `#4ADE80`. The first commit did not contain a complete green base palette;
  it supplied the emerald visual direction and restrained radius/surfaces,
  which are preserved here without restoring clinic UI.

- The palette is defined once in `apps/front-end/src/styles/index.css` and
	mapped to shadcn background, card, border, foreground, muted, primary,
	accent, ring, chart, and sidebar tokens. DispatchPilot currently ships the
	light palette only; dark-mode switching and dark tokens were intentionally
	removed to keep the product's visual system exact and consistent.
	Measured WCAG ratios are recorded
  in the cleanup/UI handoff report; status badges use their soft background
  and text-on-soft pair because white on teal or amber solids does not meet AA.
- Navigation is a typed config filtered by existing route paths and role. The
  backend remains authoritative; future pages become visible with one config
  entry after their routes exist. Mobile uses an off-canvas navigation sheet
  and a safe-area-aware bottom tab region.
- Better Auth 1.7.1 exposes `rememberMe?: boolean` on `signIn.email`; the
  login form passes the checkbox value directly, with the installed default
  preserved as checked. No storage API is used for credentials or sessions.

## Authentication foundation decisions

- Better Auth 1.7.1 owns user creation, password hashing, credential accounts,
  sessions, and sign-in/sign-out. The seed uses its server-side internal
  adapter and password hasher because the public sign-up endpoint is disabled.
  This preserves Better Auth ID and account formats without exposing a public
  registration flow.
- `user.role` is a server-controlled additional field with `input: false` and
  the database enum values `manager`, `dispatcher`, and `technician`. The
  public sign-up and user-update inputs cannot choose or change this field.
- Better Auth 1.7.1 requires `account.issuer` for credential identity lookup;
  the schema stores it as a required field and uses Better Auth's
  `local:credential` issuer. No organization or member tables are enabled.
- The seed reads every user email, name, and password from environment
  variables, repairs only a missing credential account, and never overwrites
  an existing password. Verification runs against the configured
  `DATABASE_URL`, which must point to a non-production development database.

## Backend foundation decisions

- Phase B0 uses one tracked Drizzle migration for the DispatchPilot domain
  tables: buildings, technicians, skills, contracts, SLA rules, assets, jobs,
  assignments, asset events, duration statistics, events, plan proposals,
  approvals, outbox, settings, and simulation runs. Better Auth remains on its
  existing four tables.
- The B0 seed uses stable UUIDs for domain fixtures and is idempotent through
  conflict-safe inserts. It creates safe defaults for auto-pilot off,
  confidence threshold 0.8, and dry-run on.
- The event store accepts a transaction executor so a domain state mutation and
  its append-only event can commit or roll back together. Idempotency keys are
  unique at the database layer.
- External integrations begin behind fallback-only ports: haversine travel
  time, seeded geocoding, dry-run mail, and rule-based extraction. Real
  providers can be added without changing domain services.

- Contract PDFs are stored in `CONTRACT_UPLOAD_DIR` with generated filenames
  and mode `0600`; extracted rules remain a draft until manager approval.
  This keeps contract text private and prevents unclear or injected clauses
  from becoming active SLA rules.
- The benchmark CLI is pure and seeded. It prints labelled `simulated=true`
  results; API runs persist comparable rows in `simulation_runs`. It does not
  claim production performance or edit measured output.

## Phase B1 API decisions

- B1 keeps the simple assignment baseline behind `CoreService.reassignJob`.
  Eligible technicians must have the required skill, be available, be inside
  their configured UTC shift, and are ranked by haversine distance from the
  job. Technician coordinates are persisted so this baseline remains
  deterministic and replaceable by the planner in B3.
- Job workflow transitions are enforced in the service layer. The legacy
  `open`, `scheduled`, and `attention` values remain readable for seeded or
  older rows, while new intake uses `received` through `done` (or
  `cancelled`). Invalid transitions return `INVALID_TRANSITION`.
- B1 list endpoints use timestamp cursors and compute board KPIs and SLA
  compliance from current rows rather than storing aggregates. Mutations use
  the event transaction helper, and repeated approval/status/idempotency
  operations are safe to retry.

- Contract PDFs are stored in `CONTRACT_UPLOAD_DIR` with generated filenames
  and mode `0600`; extracted rules remain a draft until manager approval.
  This keeps contract text private and prevents unclear or injected clauses
  from becoming active SLA rules.
- The benchmark CLI is pure and seeded. It prints labelled `simulated=true`
  results; API runs persist comparable rows in `simulation_runs`. It does not
  claim production performance or edit measured output.

## Phase B1 API decisions

- B1 keeps the simple assignment baseline behind `CoreService.reassignJob`.
  Eligible technicians must have the required skill, be available, be inside
  their configured UTC shift, and are ranked by haversine distance from the
  job. Technician coordinates are persisted so this baseline remains
  deterministic and replaceable by the planner in B3.
- Job workflow transitions are enforced in the service layer. The legacy
  `open`, `scheduled`, and `attention` values remain readable for seeded or
  older rows, while new intake uses `received` through `done` (or
  `cancelled`). Invalid transitions return `INVALID_TRANSITION`.
- B1 list endpoints use timestamp cursors and compute board KPIs and SLA
  compliance from current rows rather than storing aggregates. Mutations use
  the event transaction helper, and repeated approval/status/idempotency
  operations are safe to retry.

## Login split layout decisions

- The login screen uses a 50/50 desktop split: an always-dark green brand
	panel with CSS/SVG glass job blocks and a light console form. Tablet
  stacks the panel above the form; mobile keeps only the compact headline and
  live status row in the navy header.
- The brand panel calls the existing public `/api/v1/ready` route on mount and
  every 60 seconds while visible. Successful readiness is `OPERATIONAL`; a
  server response failure is `DEGRADED`; a network or client failure is
  `UNREACHABLE`. No backend changes were needed, and no response details are
  shown.
- Google sign-in is enabled only when both optional Google credentials exist.
  Better Auth disables Google sign-up and trusts only the configured Google
  provider for linking, so an unknown Google email cannot create a staff user.
  The UI exposes a clear unconfigured state when credentials are absent.
- Password reset uses Better Auth's one-use, one-hour token flow, revokes
  sessions after reset, and returns a generic request-success message. The
  adapter logs the reset URL only outside production or when `DRY_RUN=true`;
  a real sender is intentionally not added.
- The brand panel keeps the floating status tiles and adds an illustrative
  typewriter/conveyor animation. It is `aria-hidden`, CSS/React-only, and
  becomes static under reduced motion.
- Measured WCAG ratios for the updated palette are: light body 13.50:1, light
  card 13.89:1, light muted 5.15:1, light primary 5.02:1; dark body 16.05:1,
  dark card 14.29:1, dark muted 9.78:1, dark primary 8.55:1. Status text on
  soft backgrounds is light OK 6.55:1, scheduled 7.75:1, attention 5.79:1,
  late 7.05:1; dark OK 8.75:1, scheduled 8.88:1, attention 9.10:1, late
  8.88:1. Brand text against the darkest green panel is 13.28:1.

## Mock dashboard decisions

- The sidebar is a flat, heading-free list with a fixed 56px header, a 32px
  collapse control, Phosphor icons, green hover/active sidebar tokens, and a
  rail click target. Its collapsed state persists using the existing UI-only
  preference storage; job and auth data never uses localStorage.
- Frontend mock data is deterministic with a fixed timestamp and lives only in
  `apps/front-end/src/mocks`. Shared Zod schemas in `packages/shared` validate
  jobs, technicians, contracts, assignments, approvals, events, and simulator
  runs. Query hooks call the mock adapter with 200–400ms latency so pages keep
  loading/error states when the real API replaces it.
- Manager and dispatcher use Dispatch Board, Jobs, Plan Review, Contracts and
  SLA, Assets, Simulator, and Approvals and Activity. Technicians see only My
  Jobs. Settings is manager-only because the SRS pages table is more specific
  than the permissions-matrix wording about dispatcher roster visibility.
- Map is intentionally omitted from this frontend pass because Leaflet and an
  OSM map adapter are not installed; it is removed from navigation and remains
  a later task.
- Sidebar label/icon contrast in the light theme measures: idle `13.89:1`,
  hover `8.51:1`, active `7.72:1`, and count badge `6.77:1`.
