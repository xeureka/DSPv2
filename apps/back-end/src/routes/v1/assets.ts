import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { assetService } from "@/services/asset.service";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";

const assets = new OpenAPIHono<AppEnv>();
const response = z.object({ success: z.literal(true), data: z.any() });
const params = z.object({ id: z.string().uuid() });
assets.openapi(createRoute({ method: "post", path: "/assets/{id}/callback", middleware: [sessionMiddleware, requireRole("manager", "dispatcher", "technician")], request: { params, body: { content: { "application/json": { schema: z.object({ jobId: z.string().uuid().optional() }) } } } }, responses: { 200: { description: "Record callback", content: { "application/json": { schema: response } } } } }), async (c) => successResponse(c, await assetService.callback(c.req.valid("param").id, c.req.valid("json").jobId)));
assets.openapi(createRoute({ method: "post", path: "/assets/{id}/inspection", middleware: [sessionMiddleware, requireRole("manager")], request: { params }, responses: { 200: { description: "Create inspection job", content: { "application/json": { schema: response } } } } }), async (c) => successResponse(c, await assetService.inspection(c.req.valid("param").id)));
export default assets;
