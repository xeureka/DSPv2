
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

- The UI palette uses the requested tinted-neutral surfaces (`#F1F3F6` and
  `#FBFCFD`) with deep ink navy (`#1E2B57`) as the main action colour. Indigo
  is reserved for focus, links, selected rows, and chart accents. Teal, blue,
  amber, and red are reserved for semantic statuses and are always paired with
  a Phosphor icon and text label.
- The palette is defined once in `apps/front-end/src/styles/index.css` and
  mapped to shadcn background, card, border, foreground, muted, primary,
  accent, ring, chart, and sidebar tokens. Measured WCAG ratios are recorded
  in the cleanup/UI handoff report; status badges use their soft background
  and text-on-soft pair because white on teal or amber solids does not meet AA.
- Navigation is a typed config filtered by existing route paths and role. The
  backend remains authoritative; future pages become visible with one config
  entry after their routes exist. Mobile uses an off-canvas navigation sheet
  and a safe-area-aware bottom tab region.
- Better Auth 1.7.1 exposes `rememberMe?: boolean` on `signIn.email`; the
  login form passes the checkbox value directly, with the installed default
  preserved as checked. No storage API is used for credentials or sessions.

## Login split layout decisions

- The login screen uses a 50/50 desktop split: an always-dark ink-navy brand
  panel with CSS/SVG glass job blocks and a theme-aware console form. Tablet
  stacks the panel above the form; mobile keeps only the compact headline and
  live status row in the navy header.
- The brand panel calls the existing public `/api/v1/ready` route on mount and
  every 60 seconds while visible. Successful readiness is `OPERATIONAL`; a
  server response failure is `DEGRADED`; a network or client failure is
  `UNREACHABLE`. No backend changes were needed, and no response details are
  shown.
- The backend currently exposes only email/password sign-in, so the new login
  screen intentionally omits forgot-password and alternative-provider UI.
- Login text uses the existing palette. Measured ratios remain: light
  foreground/background 16.16:1, muted/background 5.24:1, white on primary
  13.65:1; dark foreground/background 15.70:1, muted/background 7.19:1, and
  foreground on the glass card surface 14.36:1. Status readouts use icon plus
  label and the existing semantic hues.
