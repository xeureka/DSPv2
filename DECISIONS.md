
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
  an existing password. Verification runs only against `TEST_DATABASE_URL`.

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
