# DispatchPilot

**A contract-aware AI dispatcher that plans the day, guarantees SLAs, and proves it.**

DispatchPilot is a field-operations platform for companies that maintain commercial buildings (elevators, AC, refrigeration). It reads repair requests and maintenance contracts, plans and re-plans each technician's day with an optimization engine, enforces service-level agreements (SLAs), learns from completed work, and produces evidence of every response.

> Level 1 assignment for brain3.ai, by Eureka T/Mariam. Demo data is synthetic. All benchmark numbers come from a seeded simulator, not from real deployments.

## Why this exists

Nobody fixed the lift in our own office building, and the cause was not technical: it was a management problem. Repairs stall when nobody owns the request, nothing has a deadline, and no one follows up or escalates.

DispatchPilot gives every request an **owner, a timer, and an escalation path**, so nothing waits quietly until someone remembers it.

## Features

### Product

|     | Feature                     | What it does                                                                                               |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P1  | Contract and SLA engine     | Reads a contract PDF into rules and live timers; produces a monthly evidence pack of timestamped responses |
| P2  | Asset registry and health   | Service history per unit; repeat callbacks raise a risk score and a recommended inspection                 |
| P3  | Capacity what-if            | Replays a typical week with different staffing and shows projected SLA compliance and travel               |
| P4  | Plan review and explanation | Before-and-after diff for every re-plan, with reason, SLA impact, and one-click approval                   |
| P5  | Safety-aware triage         | Emergency language takes the fastest escalation path                                                       |

### Engineering

|     | Feature                    | What it does                                                                                                                      |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Minimal-disruption planner | Cheapest insertion plus relocate, swap, and 2-opt search under hard constraints; cost includes a penalty for moving promised jobs |
| E2  | Learned durations          | Median and 90th percentile per equipment, technician, and building; SLA-critical jobs plan with p90                               |
| E3  | Simulator and benchmark    | Seeded digital twin of a working day, compared with a nearest-technician baseline, runs in tests                                  |
| E4  | Event-sourced core         | Append-only events with reasoning, day replay, email outbox, live board via server-sent events                                    |
| E5  | Defended AI layer          | Gemini acts only through typed, validated tools; evaluation set and prompt-injection tests                                        |

## How it works

```mermaid
flowchart LR
  A[Email or chat] --> B[Gemini extracts job]
  B --> C[Zod validates]
  C --> D[Match contract and SLA tier]
  D --> E[Planning engine assigns]
  E --> F[Notify requester, log event]
  F --> G[SLA timer and 3-level escalation]
```

**The LLM handles language; deterministic code handles decisions.**

| Gemini                                                                                            | Deterministic code                                                                    |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Understand emails, extract fields, read contracts into draft rules, draft messages, explain plans | Constraint filtering, optimization, SLA timers, statistics, validation, event logging |

Email and contract text is treated as **data, never instructions**.

## Tech stack

| Layer        | Choice                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------- |
| Frontend     | React 19, Vite, TanStack Router / Query / Table, Leaflet (OSM tiles)                         |
| Backend      | Hono on Node.js, Google Cloud Run                                                            |
| Database     | PostgreSQL (Neon) with Drizzle ORM                                                           |
| Auth         | Better Auth (sessions, roles)                                                                |
| Validation   | Zod, shared between client and server                                                        |
| Scheduling   | Google Cloud Scheduler (5-minute tick, nightly, daily and weekly)                            |
| AI           | Gemini Flash-class model via Google AI Studio                                                |
| Integrations | Gmail, Google Calendar, OSRM, Nominatim, Open-Meteo (each behind an adapter with a fallback) |

Everything runs on free tiers.

## Roles

| Role       | Can do                                                               |
| ---------- | -------------------------------------------------------------------- |
| Manager    | Everything, including contracts, autonomy settings, simulator, users |
| Dispatcher | Approve and reassign jobs and plans, view activity and asset health  |
| Technician | See and update own jobs                                              |
| Requester  | Track own request through a private emailed link (no account)        |

## Getting started

> Adjust the commands and paths below to match the actual scripts in this repo.

### Prerequisites

- Node.js 20+ and a package manager (pnpm recommended)
- A PostgreSQL database (a free Neon project works)
- A Gemini API key from Google AI Studio
- Optional: Gmail and Google Calendar OAuth credentials (test mode)

### Setup

```bash
git clone <repo-url>
cd dispatchpilot
pnpm install
cp .env.example .env     # then fill in the values below
pnpm db:migrate          # run Drizzle migrations
pnpm db:seed             # load synthetic demo data
pnpm dev                 # start API and web app
```

### Environment variables

| Variable                                   | Purpose                                                 |
| ------------------------------------------ | ------------------------------------------------------- |
| `DATABASE_URL`                             | PostgreSQL connection string                            |
| `BETTER_AUTH_SECRET`                       | Session signing secret                                  |
| `BETTER_AUTH_URL`                          | Public base URL of the API                              |
| `GEMINI_API_KEY`                           | Gemini API key                                          |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Gmail, Calendar, and Google sign-in OAuth               |
| `DRY_RUN`                                  | `true` to log outbound messages instead of sending them |

Secrets live in environment variables and are never committed.

### Running without every integration

Every external service has a fallback, so the core loop works offline from them:

| Service    | Fallback                                                       |
| ---------- | -------------------------------------------------------------- |
| Gemini     | Rule-based parser, manual rule entry, message templates        |
| Gmail      | Simulated inbox endpoint; outbound messages written to the log |
| Calendar   | Internal timeline view                                         |
| OSRM       | Haversine distance with a speed factor                         |
| Nominatim  | Pre-seeded coordinates                                         |
| Open-Meteo | Weather feature skipped                                        |

## Demo walkthrough

1. **New job:** send a request through the command bar or the simulated inbox, such as "The lift on our floor has been out of service since this morning." Watch it become a job, match its contract tier, and get a proposed technician with an explanation.
2. **Technician delay:** mark a technician "running late" on My Jobs. Open **Plan Review** to see the before-and-after diff, SLA impact, and number of jobs moved, then approve it.
3. **SLA escalation:** let a job near its deadline and watch the three-level escalation (technician, dispatcher, manager).
4. **Contract onboarding:** upload a contract PDF, review the extracted rules, approve them, and see them go live as timers.
5. **Simulator:** run the planner against the baseline over 100 simulated days and try the "add one elevator technician" what-if.

Turn on **dry-run mode** to show exactly what the agent would send without sending anything.

## Testing

```bash
pnpm test              # unit and property tests (including the planner)
pnpm sim:benchmark     # seeded simulator: planner vs nearest-technician baseline
pnpm eval:extraction   # extraction accuracy on the evaluation set
pnpm test:injection    # prompt-injection test cases
```

Targets: extraction accuracy of at least 90% on the evaluation set, every injection test handled safely, and a planner that finishes in 2 seconds for 8 technicians and 40 jobs.

## Project structure

> Proposed layout. Update it to match the repo.

```
.
├── apps/
│   ├── front-end/              # React 19 + Vite frontend
│   └── back-end/              # Hono backend (routes, services, repositories)
├── packages/
│   └── shared/           # Zod schemas and shared types
├── sim/                  # Seeded simulator and benchmark
├── eval/                 # Extraction evaluation set and injection tests
├── docs/
│   ├── PRD.md            # Product requirements
│   ├── IMPLEMENTATION_PLAN.md # Phase plan and priorities
│   └── DispatchPilot_SRS_REVISED.pdf # Solution design and specification (v2)
└── README.md
```

## Documentation

- [Product Requirements Document](docs/PRD.md): scope, features, workflows, requirements, risks
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md): phase order, priorities, and cut gates
- [SRS v2](docs/DispatchPilot_SRS_REVISED.pdf): full solution design and specification, including references

## Scope

**MVP:** email and chat intake, contract ingestion and SLA rules, planning engine with re-optimization, SLA timers and escalation, duration learning, asset history and repeat-failure detection, simulator and what-if, requester notifications, role-based dashboard, approval queue, event log.

**Roadmap:** invoicing and payments, parts inventory, native technician mobile app, requester photo and voice intake, technician manual-search copilot, multi-company tenancy.

## Limitations

- Demo runs on synthetic data only.
- Industry figures used for context come from mixed-quality sources, many published by software vendors. Treat them as directional.
- Simulator results are labelled as simulated, with seeds published so they can be reproduced.

## Author

**Eureka T/Mariam**, built as the Level 1 assignment for brain3.ai.
