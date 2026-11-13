# DispatchPilot: Implementation Phase Plan

Plan for building DispatchPilot from the approved SRS v2 to a complete, demo-ready submission.

|                      |                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Source documents** | SRS v2, `docs/PRD.md`                                                                                                                   |
| **Deadline**         | Ideally Friday night, San Francisco time (reviewer: Kidus). That is **about 11:00 AM Saturday in Addis Ababa** (SF is 11 hours behind). |
| **Working target**   | Finish by **8:00 AM Saturday Addis time**, leaving a buffer                                                                             |
| **Principle**        | Build the **Must** items first, end to end, then add **Should** items. **Could** items are roadmap.                                     |

> Hours below are working hours from the moment you start building. Map them to the clock yourself, and put real sleep in the schedule. A rested final 3 hours beats two extra exhausted ones.

---

## 1. Time budget

| Phase | Focus                   | Budget     | Scope                  |
| ----- | ----------------------- | ---------- | ---------------------- |
| 0     | Foundations             | 2.5 h      | Must                   |
| 1     | Core loop               | 3 h        | Must                   |
| 2     | Planning engine         | 5 h        | Must                   |
| 3     | SLA and contracts       | 4 h        | Must                   |
| 4     | Simulator and benchmark | 3 h        | Must                   |
| 5     | Should items            | 5 h        | Should (cut as needed) |
| 6     | Deploy, docs, demo      | 3 h        | Required               |
|       | **Total**               | **25.5 h** |                        |

Must items alone take about **17.5 h**. Everything after that is a bonus, and a bonus that is half-finished hurts the demo.

### Cut gates (decide, do not drift)

| Gate   | When                      | Rule                                                                                                           |
| ------ | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **G1** | End of Phase 1            | A job must go from message to an assigned technician. If not, stop adding anything else.                       |
| **G2** | End of Phase 3            | If Phases 0 to 3 are not done by about **hour 14**, skip all of Phase 5 except dry-run and the evaluation set. |
| **G3** | **5 hours before cutoff** | Freeze features. Only deploy, docs, and demo from here.                                                        |

---

## 2. Phase 0: Foundations (2.5 h)

**Goal:** sign-in works, roles apply, demo data and the event log exist.

- [ ] **Check external access first (15 min).** Create the Gemini AI Studio key, and confirm the GCP project and billing-free setup work from Ethiopia. If anything is blocked, switch hosting now (SRS risk: regional restrictions) and tell the recruiter.
- [ ] Repo structure: `apps/web`, `apps/api`, `packages/shared`, `sim`, `eval`, `docs`
- [ ] `packages/shared`: Zod schemas and types for job, technician, contract, SLA rule, assignment, event
- [ ] Drizzle schema and migrations for all tables in the PRD data model
- [ ] Better Auth with roles (manager, dispatcher, technician) and a role-check middleware on every route
- [ ] **Event log:** `appendEvent(type, payload, reasoning, autonomy)` helper, used from day one
- [ ] Seed script: 8 technicians with skills and shifts, 3 to 4 customers with contracts, about 10 assets, and a day of sample jobs with fixed coordinates
- [ ] Adapter interfaces with fallbacks written now: `getTravelTime`, `geocode`, `sendMessage`. Start with the fallback versions (haversine, seeded coordinates, logged messages).
- [ ] Frontend shell: TanStack Router, left nav, command bar, role-based route guards

**Done when:** you can sign in as each role, see seeded data, and an event row is written on a test action.

---

## 3. Phase 1: Core loop (3 h)

**Goal:** a message becomes a validated job and an assigned technician.

- [ ] Simulated inbox endpoint plus command bar as the intake path (real Gmail is optional)
- [ ] Gemini extraction with structured JSON output, Zod validation, and a confidence score
- [ ] Safety keyword detection that sets `safety_flag` and routes to the emergency path (FR-3)
- [ ] Geocode through the adapter, cached in Postgres
- [ ] Contract lookup by customer to attach `contract_id` and `sla_due`
- [ ] **Simple assignment first** (nearest eligible technician by skill and shift). The real planner replaces it in Phase 2.
- [ ] Approval queue: emergencies and low-confidence jobs wait for a human
- [ ] Notifier with **dry-run mode**: confirmation message is logged, not sent
- [ ] Jobs page: table, status, approve or reassign

**Done when (Gate G1):** typing "The lift on our floor has been out of service since this morning" creates a flagged job, assigns a technician, and logs every step as events.

> **Deploy a first version now** (end of this phase) to Cloud Run and Neon. Finding a deployment problem at hour 20 is how submissions fail.

---

## 4. Phase 2: Planning engine (5 h)

**Goal:** a delay produces a minimal-disruption re-plan the dispatcher can review.

Build it as a **pure, testable TypeScript module** with no database calls inside.

- [ ] Types: `Plan`, `Route`, `Stop`, `CostBreakdown`
- [ ] Hard constraints: skill, shift hours, no overlap, reachable before SLA
- [ ] Cost function: travel + SLA-weighted lateness + overtime + imbalance + **disruption**
- [ ] Cheapest-insertion construction
- [ ] Local search with relocate, swap, and 2-opt, stopped by a **2-second time budget**
- [ ] Re-optimization from the current plan with the disruption penalty (the promised-job penalty is what makes it "minimal disruption")
- [ ] Plan diff: moved jobs, SLA impact, travel change
- [ ] Delay endpoint: technician "running late" triggers recompute and creates a proposed plan
- [ ] Plan Review page: before and after, reasons, approve or reject
- [ ] Gemini writes the plain-language explanation; template text is the fallback
- [ ] **Property tests:** no overlaps, every assigned job satisfies skills and shifts, cost never worse than insertion-only, and a deterministic result for a fixed seed

**Done when:** marking one technician 25 minutes late shows a diff such as "1 job moved, 0 SLA breaches", and approving it updates assignments and notifies the requester.

---

## 5. Phase 3: SLA and contracts (4 h)

**Goal:** a contract becomes enforced SLAs, with proof.

- [ ] SLA rule model: tier, response minutes, resolution target, callback cap, credit terms
- [ ] Contract PDF extraction with Gemini (PDF input), Zod validation, and a flag on any unclear clause
- [ ] Contract review screen with **manager approval before rules go live** (FR-10)
- [ ] SLA timer attached to every job at creation (`sla_due`)
- [ ] **Scheduled tick endpoint** (`/internal/tick`), protected by a secret, that:
    - flags late technicians
    - escalates jobs nearing their SLA in three levels (technician, dispatcher, manager)
    - refreshes ETAs
- [ ] Escalation timing by tier, fastest for safety-critical jobs
- [ ] Each response and escalation written as an event (this is the **evidence**)
- [ ] Contracts and SLA page: compliance, at-risk jobs, credit exposure
- [ ] Evidence pack: start as a downloadable CSV or JSON of timestamped responses; upgrade to PDF only if time remains

**Done when:** an uploaded contract, once approved, drives deadlines, and a job left alone climbs all three escalation levels (use a shortened timer for the demo).

---

## 6. Phase 4: Simulator and benchmark (3 h)

**Goal:** evidence instead of claims.

- [ ] Seeded random number generator so every run is reproducible
- [ ] Generator for jobs, breakdowns, and delays over a working day
- [ ] Two policies run side by side: **nearest-technician baseline** and **DispatchPilot planner**
- [ ] Metrics: SLA hit rate, travel minutes, jobs moved after delays
- [ ] CLI: 100 simulated days, results stored in `simulation_runs`
- [ ] Simulator page: policy comparison table and chart, with scenarios (normal, heat wave, sick leave)
- [ ] A test that runs a short simulation in CI
- [ ] **Publish the seeds and label every figure as simulated**

**Done when:** you have a measured table where the planner beats the baseline, and you can reproduce it with one command.

> If the planner does not beat the baseline, report that honestly and tune the cost weights. Never edit results.

---

## 7. Phase 5: Should items (5 h, cut at Gate G2)

Do these **in this order**, and drop from the bottom.

| Order | Item                                                                                                 | Budget | Why it matters                                          |
| ----- | ---------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------- |
| 1     | Evaluation set (30 to 50 labelled messages) and **prompt-injection tests**                           | 1.5 h  | Proves the "defended AI layer", a stated differentiator |
| 2     | Auto-pilot toggle, confidence threshold, dry-run switch in Settings                                  | 0.5 h  | Cheap, and it demonstrates safe autonomy                |
| 3     | Asset registry, repeat-failure detection (3 or more callbacks in 60 days), inspection recommendation | 1.5 h  | The "lift story" feature                                |
| 4     | Duration learning (median and p90, shrinkage)                                                        | 1 h    | Feeds the planner and simulator                         |
| 5     | Capacity what-if on the simulator page                                                               | 1 h    | The clearest "reason to pay"                            |
| 6     | Server-sent events live board                                                                        | 0.5 h  | Polling already works as a fallback                     |

**Could items** (live OSRM map, Google Calendar, weather alerts, weekly brief, requester tracking page) are **not** planned. Mention them as roadmap in the README.

---

## 8. Phase 6: Deploy, docs, demo (3 h, after Gate G3)

- [ ] Final deployment: Cloud Run API, Neon database, frontend host, Cloud Scheduler jobs for tick, nightly, and daily
- [ ] Production secrets set in environment variables, none in the repo
- [ ] Fresh-database test: migrate, seed, and walk the full demo on the deployed URL
- [ ] README commands verified (replace the placeholder script names with the real ones)
- [ ] `docs/PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, and the SRS PDF are in `/docs`
- [ ] **Record the demo video** (5 to 8 minutes), following the script below
- [ ] Record a fallback take of the main scenario
- [ ] Send the final email to Kidus with links: repository, deployed app, demo video, docs, and test credentials for each role

### Demo script

1. **Problem (30 s):** the lift story, then "every request gets an owner, a timer, and an escalation path."
2. **New job:** type the lift message. Show extraction, safety flag, contract tier, assignment, and the explanation.
3. **Technician delay:** mark late, open Plan Review, point at "1 job moved, 0 SLA breaches", approve.
4. **SLA escalation:** show a job climbing the three levels, and the evidence trail.
5. **Contract onboarding:** upload, review extracted rules, approve.
6. **Simulator:** show the planner against the baseline over 100 days.
7. **Safety and trust:** dry-run mode, event log with reasoning, and the injection test results.
8. **Close:** what is built, what is roadmap.

---

## 9. Working rules

- **Vertical slices.** Finish one workflow end to end before starting the next.
- **Fallbacks first.** Build the haversine, seeded-coordinate, and logged-message versions before the real integrations. The demo must not depend on a free tier behaving.
- **Commit small and often**, with working code on `main` after every phase. Tag each phase (`phase-1-done`).
- **Seed the demo data to tell the story:** one Gold-tier tower with a safety-critical lift job, one technician who will run late, one asset with 4 callbacks in 60 days.
- **Do not polish the UI** until Phases 0 to 4 work. Use plain TanStack Table and simple status colours (teal, blue, amber, red).
- **Use AI coding help for boilerplate** (schemas, CRUD, tables). Write the planner and the cost function yourself, because you will have to explain them.
- **Keep a running "what I cut and why" list** for the README's limitations section.

## 10. Risk triggers

| If this happens                             | Do this                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| GCP or Gemini key blocked in the first hour | Switch hosting (for example a Node host with a long request limit), message Kidus, and continue |
| Gmail OAuth takes more than 20 minutes      | Keep the simulated inbox for intake and log outbound messages                                   |
| Planner is slow or produces odd plans       | Reduce to insertion plus relocate, and keep the time budget                                     |
| Behind schedule at G2                       | Drop Should items 3 to 6                                                                        |
| Deployment breaks after G3                  | Run locally, record the demo from local, and submit the repo with deployment notes              |

## 11. Final submission checklist

- [ ] Repository on GitHub with clear history and tagged phases
- [ ] README, `docs/PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, and the SRS PDF
- [ ] Deployed URL working, with seeded demo data and test accounts
- [ ] Demo video and fallback video
- [ ] `.env.example` complete, with no secrets committed
- [ ] Tests pass: planner property tests, simulator, extraction evaluation, injection cases
- [ ] Final email sent to Kidus before the cutoff, with all links
