import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { planService } from "@/services/plan.service";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";

const plans = new OpenAPIHono<AppEnv>();
const staff = [sessionMiddleware, requireRole("manager", "dispatcher")];
const response = z.object({ success: z.literal(true), data: z.any() });
const id = z.object({ id: z.string().uuid() });
plans.openapi(createRoute({ method: "get", path: "/plans/proposals", middleware: staff, request: { query: z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }) }, responses: { 200: { description: "Plan proposals", content: { "application/json": { schema: response } } } } }), async (c) => successResponse(c, await planService.list(c.req.valid("query").status)));
plans.openapi(createRoute({ method: "get", path: "/plans/proposals/{id}", middleware: staff, request: { params: id }, responses: { 200: { description: "Plan proposal", content: { "application/json": { schema: response } } } } }), async (c) => successResponse(c, await planService.get(c.req.valid("param").id)));
for (const decision of ["approve", "reject"] as const) plans.openapi(createRoute({ method: "post", path: `/plans/proposals/{id}/${decision}`, middleware: staff, request: { params: id }, responses: { 200: { description: "Plan decision", content: { "application/json": { schema: response } } } } }), async (c) => { const user = c.get("user"); if (!user) throw new AppError("Authentication required", 401, ErrorCode.UNAUTHORIZED); return successResponse(c, await planService.decide(c.req.valid("param").id, decision === "approve" ? "approved" : "rejected", user.id)); });
export default plans;
