
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
