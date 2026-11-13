# DispatchPilot API

The backend publishes the application OpenAPI document at /openapi.json and
the Scalar UI at /docs.

Better Auth publishes the complete generated authentication schema at
/api/auth/open-api/generate-schema and its Scalar UI at /api/auth/reference.

The B0 protected foundation check is:

GET /api/v1/foundation

It requires a Better Auth session and returns the validated counts of seeded
buildings, technicians, contracts, assets, jobs, events, and settings.

Generate or apply database changes from apps/back-end:

pnpm db:generate
pnpm db:migrate
pnpm seed
