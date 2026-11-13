import test from "node:test";
import assert from "node:assert/strict";
import { plan } from "./planner";
test("planner is deterministic and respects skills", () => { const input = { now: 480, technicians: [{ id: "t1", position: { latitude: 9, longitude: 38 }, shiftStart: 480, shiftEnd: 1020, skills: ["elevator"] }], jobs: [{ id: "j1", location: { latitude: 9, longitude: 38 }, skill: "elevator", medianMinutes: 30, p90Minutes: 45, slaDue: 700, urgency: 2 }] }; const first = plan(input); assert.deepEqual(first, plan(input)); assert.equal(first.assignments.j1, "t1"); });
