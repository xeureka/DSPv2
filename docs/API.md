# DispatchPilot API

The backend publishes the application OpenAPI document at /openapi.json and
the Scalar UI at /docs.

Better Auth publishes the complete generated authentication schema at
/api/auth/open-api/generate-schema and its Scalar UI at /api/auth/reference.

The B0 protected foundation check is:

GET /api/v1/foundation

It requires a Better Auth session and returns the validated counts of seeded
buildings, technicians, contracts, assets, jobs, events, and settings.

## Phase B1 routes

All routes below are under /api/v1 and use the shared success/error envelope.
The application OpenAPI document lists their request validation and role
middleware.

- Board: GET /board
- Jobs: GET /jobs, GET /jobs/{id}, POST /jobs, POST /jobs/{id}/approve,
  POST /jobs/{id}/reassign, GET /jobs/{id}/events
- Technicians: GET /technicians, PATCH /technicians/{id},
  POST /technicians/{id}/status, GET /me/jobs
- Approvals: GET /approvals, POST /approvals/{id}/approve,
  POST /approvals/{id}/reject
- Events: GET /events, GET /events/replay
- Assets: GET /assets, GET /assets/{id}
- Contracts and SLA: GET /contracts, GET /contracts/{id},
  GET /sla/compliance
- Settings: GET /settings, PATCH /settings/autonomy
- Public health: GET /health and GET /ready

Job creation accepts inboundMessageId as its idempotency key. Job mutations,
approval decisions, technician status updates, and settings changes append
events transactionally. Cursor pagination uses the returned nextCursor value.

Generate or apply database changes from apps/back-end:

pnpm db:generate
pnpm db:migrate
pnpm seed
## Phase B endpoints

The backend exposes the live workflows under `/api/v1`:

- `POST /intake/messages` and `POST /intake/command`
- `GET /plans/proposals`, `GET /plans/proposals/:id`, and proposal approve/reject
- `POST /contracts/:id/approve` and `GET /sla/evidence-pack`
- `POST /simulations/run`, `POST /simulations/what-if`, and `GET /simulations`
- `POST /assets/:id/callback` and `POST /assets/:id/inspection`
- `POST /internal/tick` with `x-scheduler-secret`
- `GET /stream` for authenticated SSE updates with `Last-Event-ID` resume

The frontend uses these routes by default. Set `VITE_USE_MOCK_DATA=true` only for the explicitly labelled demo adapter.
