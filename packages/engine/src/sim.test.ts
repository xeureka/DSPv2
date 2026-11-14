import test from "node:test";
import assert from "node:assert/strict";
import { runSimulation } from "./sim";
test("simulation is deterministic for a fixed seed", () => { const input = { days: 10, seed: 42, scenario: "normal" as const }; assert.deepEqual(runSimulation(input), runSimulation(input)); });
