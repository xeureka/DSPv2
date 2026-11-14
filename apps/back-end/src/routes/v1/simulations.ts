import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { runSimulation } from "@dspv2/engine";
import { z } from "zod";
import { db } from "@/db";
import { simulationRuns } from "@/db/schema";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";

const simulations = new OpenAPIHono<AppEnv>();
const response = z.object({ success: z.literal(true), data: z.any() });
const input = z.object({ days: z.number().int().min(1).max(100), seed: z.number().int(), scenario: z.enum(["normal", "heat wave", "sick leave"]) });
const read = [sessionMiddleware, requireRole("manager", "dispatcher")];
const write = [sessionMiddleware, requireRole("manager")];
simulations.openapi(createRoute({ method: "get", path: "/simulations", middleware: read, responses: { 200: { description: "Simulation runs", content: { "application/json": { schema: response } } } } }), async (c) => successResponse(c, await db.select().from(simulationRuns)));
simulations.openapi(createRoute({ method: "post", path: "/simulations/run", middleware: write, request: { body: { content: { "application/json": { schema: input } } } }, responses: { 200: { description: "Run simulation", content: { "application/json": { schema: response } } } } }), async (c) => { const value = runSimulation(c.req.valid("json")); const rows = await db.insert(simulationRuns).values([{ seed: value.seed, policy: `baseline:${value.scenario}`, slaHitRate: (value.baselineSla / 100).toFixed(4), travelMinutes: value.baselineTravel, jobsMoved: 0, isSimulated: true }, { seed: value.seed, policy: `planner:${value.scenario}`, slaHitRate: (value.plannerSla / 100).toFixed(4), travelMinutes: value.plannerTravel, jobsMoved: value.jobsMoved, isSimulated: true }]).returning(); return successResponse(c, { ...value, rows }); });
simulations.openapi(createRoute({ method: "post", path: "/simulations/what-if", middleware: write, request: { body: { content: { "application/json": { schema: input.extend({ technicianCount: z.number().int().positive() }) } } } }, responses: { 200: { description: "Run simulation what-if", content: { "application/json": { schema: response } } } } }), async (c) => { const value = runSimulation(c.req.valid("json")); return successResponse(c, { ...value, technicianCount: c.req.valid("json").technicianCount, simulated: true }); });
export default simulations;
