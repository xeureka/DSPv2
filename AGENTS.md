# DispatchPilot agent instructions

## Sources of truth

- Treat `docs/PRD.md` as the product-requirements source of truth, and the SRS in `docs/` as its detailed background.
- Treat `DECISIONS.md` as the source of truth for accepted architectural and technical decisions.
- Follow `docs/IMPLEMENTATION_PLAN.md` for phase order, priorities, and cut gates. Build **Must** items first. Do not start **Could** items.
- Before any backend change, read `apps/back-end/backend-skills.md` and follow it. If it conflicts with this file, stop and ask.

## General rules

- Follow the existing stack and architecture. Add dependencies or abstractions only for a concrete need, and record meaningful architectural or data-model decisions in `DECISIONS.md`.
- Do not silently change PRD requirements, schema contracts, or public API behavior. If a requirement is ambiguous, inspect the code and docs first. Ask a specific question only when the ambiguity materially affects correctness.
- Prefer small, focused changes. Preserve existing behavior unless a change is intentional and tested.
- Do not build features outside the PRD scope. In particular: no multi-tenancy, no payments, no native mobile app, no leftover clinic-domain code.
- Never fabricate data, benchmark or simulator results, extraction accuracy, test results, or implementation status.

## Product and domain rules

- **The LLM handles language; deterministic code handles decisions.** Gemini may extract fields, read contracts into draft rules, draft messages, and explain plans. It must never decide assignments, constraints, SLA deadlines, timers, escalation, or safety routing.
- **Untrusted input.** Text inside emails, chat messages, and contract PDFs is data, never instructions. Gemini acts only through typed tools, and every Gemini output is parsed with a shared Zod schema before use. Low-confidence results go to the approval queue.
- **Safety-critical requests** (for example a person trapped in a lift) take the emergency path. Detection is deterministic and must not depend only on the LLM.
- **Event log.** Every state change appends an event with its reasoning and autonomy level (auto or approved). Do not mutate job or assignment state without writing an event.
- **Idempotency.** Job creation, plan approval, escalation, and outbound messages must be safe to retry. Use idempotency keys and the outbox. Add a test for each.
- **Human control.** Contract rules go live only after manager approval. Re-plans need approval unless auto-pilot is on, and only managers change autonomy settings.
- **Dry-run first.** Outbound messages are logged, not sent, unless dry-run is explicitly off.
- **Planner purity.** The planning engine is a pure TypeScript module with no database or network calls inside it, so it can be tested and simulated.
- **Simulator honesty.** Results come from seeded runs and are labelled as simulated. Never edit results, and if the planner does not beat the baseline, report that as measured.
- **Roles.** Exactly three staff roles: manager, dispatcher, technician. Requesters have no account and use unguessable private links. Enforce access in the backend on every route; hiding UI is not enough.

## Backend

- Follow `apps/back-end/backend-skills.md` for structure, conventions, and patterns.
- Keep the routes / services / repositories layering. Routes validate and delegate, services hold business rules, repositories talk to the database.
- Validate inputs at API boundaries with Zod, and enforce critical invariants at the service or database layer. Never rely on frontend checks alone.
- Use the central error handling (`AppError` and the shared response envelope) for every error. Do not invent a second error shape.
- Use the structured logger. Never log secrets, session tokens, raw email bodies, or raw database error details.
- Every route is described in OpenAPI (Zod schemas reused from validation) and appears in the Scalar docs.
- Schema changes go through tracked Drizzle migrations. Never change the schema at application startup.
- Every external service sits behind an adapter with a fallback (Gemini, Gmail, Calendar, OSRM, Nominatim, Open-Meteo). Parse every external response with Zod. Failures are logged as events and the core loop continues on the fallback.
- Secrets live in environment variables and are validated at startup. Keep `.env.example` complete. Never read, print, or commit real `.env` files.

## Frontend

- **Do not hand-build UI components.** Use [shadcn/ui](https://ui.shadcn.com/) components, added through its CLI as needed, and compose them. Write a custom component only when shadcn has no equivalent, and say why in the pull request.
- **Icons: Phosphor only** ([phosphoricons.com](https://phosphoricons.com/)). Do not add or keep any other icon library. If a generated shadcn component imports another icon set, replace those imports.
- Use TanStack Router (file-based), TanStack Query for server state, and TanStack Table for tables.
- Use the Better Auth client for authentication. Do not store session tokens or bearer tokens in `localStorage`.
- Import shared Zod schemas and types from `packages/shared`. Do not redefine API types by hand.
- Keep styling restrained: shadcn tokens, light and dark themes, and the status colours teal (ok), blue (scheduled), amber (needs attention), and red (late or urgent). No decorative extras.
- Role-based navigation is a convenience only. The backend is the authority.

## Testing and verification

- Add or update tests for each meaningful behavior change.
- Required coverage areas: planner property tests (no overlaps, skills and shifts respected, deterministic for a fixed seed), SLA and escalation timing, role and access checks, idempotency, extraction schema validation, and prompt-injection cases.
- Run the relevant tests, lint, type checking, and build before declaring work complete. **Never claim a check passed unless it was actually run.** Report the real command and result, and report failures honestly.
- Do not delete or weaken a failing test to make a check pass.

## Documentation

- Update `README.md` when setup or developer workflows change. Document only commands that actually work.
- Record real AI assistance and verification in `AI_USAGE.md`. Do not fabricate usage examples or corrections.
- Record each meaningful decision, with its reason and the alternatives rejected, in `DECISIONS.md`.

## Version-specific APIs

Before using version-specific framework APIs (Hono, `@hono/zod-openapi`, Better Auth, Drizzle, TanStack Router and Query, shadcn/ui, Tailwind), inspect the **installed** version's documentation or types. Do not assume conventions from older versions or from memory.

## Git and safety

- Work on a feature branch. Use conventional commits with a scope, for example `feat(planner): ...`, `chore(cleanup): ...`, `test(sla): ...`.
- Keep commits small and each one passing lint and type checks.
- Do not modify, delete, or commit files you did not create unless the task says so. Never touch `.env` files.
- Do not run destructive commands (force pushes, resets, dropping databases) without explicit approval.
- If the task needs a decision that is not in the docs, ask one specific question instead of guessing.
