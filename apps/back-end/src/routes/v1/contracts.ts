import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { contractService } from "@/services/contract.service";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";

const contracts = new OpenAPIHono<AppEnv>();
const response = z.object({ success: z.literal(true), data: z.any() });
contracts.openapi(createRoute({ method: "post", path: "/contracts/{id}/approve", middleware: [sessionMiddleware, requireRole("manager")], request: { params: z.object({ id: z.string().uuid() }) }, responses: { 200: { description: "Approve contract", content: { "application/json": { schema: response } } } } }), async (c) => { const user = c.get("user"); if (!user) throw new AppError("Authentication required", 401, ErrorCode.UNAUTHORIZED); return successResponse(c, await contractService.approve(c.req.valid("param").id, user.id)); });
contracts.openapi(createRoute({ method: "get", path: "/sla/evidence-pack", middleware: [sessionMiddleware, requireRole("manager", "dispatcher")], responses: { 200: { description: "CSV evidence pack", content: { "application/json": { schema: response } } } } }), async (c) => successResponse(c, await contractService.evidencePack()));
export default contracts;
