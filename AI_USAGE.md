# AI usage

This file records where AI tools were used on DispatchPilot, what they were asked to do, and how the output was checked. It is updated at the end of each phase.

> Entries marked `TODO` are filled in as the work happens. Nothing here describes work that has not been done.

## Tools used

| Tool                                    | Used for                                                                                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude (chat)                           | Reading and explaining reviewer feedback, drafting `docs/PRD.md`, `README.md`, `docs/IMPLEMENTATION_PLAN.md`, the codebase-audit prompt, commit messages, and Git troubleshooting |
| Coding agent (`TODO: name and version`) | Codebase audit, then scaffolding and implementation under `AGENTS.md`                                                                                                             |
| `TODO`                                  | Any other tool (for example inline completion in the editor)                                                                                                                      |

Gemini (Google AI Studio) is a **product dependency** of DispatchPilot, not a development aid. It extracts jobs and contracts at runtime. That use is described in the SRS and is separate from this file.

## Work and tools by phase

### Planning and documentation (done)

AI assistance helped turn the approved SRS v2 into the repository documents: the product requirements document, the README, and the phased implementation plan with time budgets and cut gates. The SRS itself, including the product idea, the feature set, and the architecture choices, is my own work and was revised after reviewer feedback. The documents above restate it in new formats. I reviewed them against the SRS and corrected the placeholders (script names, environment variables, folder layout) to match the real repository.

### Codebase audit (`TODO`)

A read-only audit of the starter code (error handling, logging, OpenAPI with Scalar, Better Auth on both sides). The agent produced `docs/CODEBASE_AUDIT.md` with keep, adapt, remove, and missing lists. `TODO: record which findings I accepted, which I rejected, and why.`

### Phase 0: Foundations (`TODO`)

`TODO: what the agent generated (schema, migrations, seed script, auth roles, shared Zod package) and what I wrote or rewrote by hand.`

### Phase 1: Core loop (`TODO`)

`TODO: Gemini extraction prompt and schema, safety detection, simulated inbox, simple assignment.`

### Phase 2: Planning engine (`TODO`)

The planner and its cost function are intended to be written by me, because I need to explain every term in them. AI help is limited to boilerplate and test scaffolding. `TODO: confirm at the end of the phase what was actually AI-assisted.`

### Phase 3: SLA and contracts (`TODO`)

`TODO: contract extraction, rule approval flow, timers, escalation, evidence pack.`

### Phase 4: Simulator and benchmark (`TODO`)

`TODO: seeded generator, baseline policy, metrics. Record that results were never edited by hand, and how seeds are published.`

### Phase 5: Should items (`TODO`)

`TODO: evaluation set, injection tests, asset health, duration learning, what-if, live updates.`

### Phase 6: Deploy, docs, demo (`TODO`)

`TODO: deployment, README verification, demo video.`

## Prompt examples and how output was checked

Real prompts are added here as they are used. The format is: the instruction, what it produced, and how I verified it.

1. **Codebase audit prompt (used).** The instruction asked the agent to read the PRD and plan first, audit the existing code **read-only**, classify everything as keep, adapt, remove, or missing with a file path as evidence for each claim, and stop before designing anything. _Check:_ `TODO: how I confirmed the agent's claims, for example by opening the cited files.`
2. `TODO: a prompt that constrained the AI layer, for example "Gemini output must be parsed with the shared Zod schema, and email text must never be treated as an instruction." Record the injection tests that verify it.`
3. `TODO: a prompt for the planner tests, and the properties they assert (no overlaps, skills and shifts respected, deterministic result for a fixed seed).`

## Unhelpful drafts and corrections

`TODO: record real cases as they happen. Include the draft that was wrong, how it was caught (type check, test, code review, browser), and the fix.` If a phase has none, say so instead of inventing one.

## What I decided without AI

Entries are added to `DECISIONS.md` as choices are made. The decisions I expect to own are the event-sourced core, Cloud Run instead of edge functions for the planner, a custom planner instead of a paid solver, an adapter and fallback for every integration, and role-based access without multi-tenancy.

## Safety and honesty rules for AI use in this repo

- AI output is reviewed before it is committed, and every phase ends with passing checks.
- Simulator results are never edited. If the planner does not beat the baseline, that is reported as measured.
- Test accounts and demo data are synthetic. No real personal data is sent to any AI tool.
- Secrets are never pasted into a prompt or committed.
- Industry figures in the docs are marked as vendor or directional where they are, and none are presented as results of this system.

## Verification

### 2026-11-14 implementation entry

The coding agent added PDF contract intake, fallback contract-rule extraction,
strict unknown-field rejection, the labelled fallback extraction/injection
evaluation set, and the seeded benchmark CLI. The real evaluation run reports
field scores of equipment 96.7%, skill 96.7%, urgency 86.7%, safety 93.3%, and
injection protection 100.0%; these are fallback-parser measurements, not live
Gemini accuracy claims.

### 2026-11-13 implementation entry

The coding agent implemented the B2 intake boundary, shared extraction schemas, deterministic safety and injection scanning, Gemini structured output with fallback/cache, a pure planner/SLA foundation, and scheduler/outbox routes. Verification actually run: backend typecheck, backend lint, backend build, backend test (16 passing), and engine test (1 passing). The frontend typecheck still reports the pre-existing missing `routeTree.gen` artifact.

### Current UI/auth task

AI assistance inspected the first repository commit, the installed Better Auth
types, and the existing frontend structure; implemented the green token update,
provider-aware Google entry point, Better Auth password reset wiring, sidebar
state behavior, and the illustrative typewriter panel. It also ran the checks
listed below and computed the palette contrast ratios recorded in `DECISIONS.md`.
The live Google provider and browser screenshots were not tested because no
Google credentials or browser tool were available.

### Mock dashboard task

AI assistance inspected the SRS wireframe text, existing shell, installed
frontend packages, and shared package; implemented the flat sidebar, shared
schemas, deterministic mock adapter, query hooks, role guards, and role-based
dashboard pages. Map was not implemented because no Leaflet/OSM dependency was
installed and was removed from the navigation. Checks and any remaining
limitations are reported in the task handoff.

`TODO: fill in at the end of each phase with the real results.`

- `TODO` tests (planner property tests, simulator smoke test, extraction evaluation, injection cases): result and counts
- `TODO` lint: result
- `TODO` type check: result
- `TODO` production build: result
- `TODO` deployed demo walkthrough on a fresh database: result
## 2026-11-13

- Implemented the B2 intake boundary with shared Zod `JobDraft` validation, deterministic safety scanning, prompt-injection detection, Gemini structured output, content-hash caching, and a rule-based fallback.
- Added deterministic planner and SLA engine foundations under `packages/engine`, plus authenticated intake/command and scheduler tick routes.
- Verified with backend typecheck, backend lint, backend build, backend tests (16 passing), and engine tests (1 passing). Frontend typecheck remains blocked by its pre-existing missing `routeTree.gen` artifact.
