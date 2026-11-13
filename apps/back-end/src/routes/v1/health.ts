import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { checkDatabaseConnection } from "@/db/health";
import { ErrorCode } from "@/lib/errors/error-codes";
import type { AppEnv } from "@/types/hono";
import { errorResponse, successResponse } from "@/utils/api-response";

const statusSchema = z.object({
	status: z.literal("ok"),
	service: z.literal("dispatchpilot-api"),
});

const successStatusSchema = z.object({
	success: z.literal(true),
	data: statusSchema,
});

const healthRoute = createRoute({
	method: "get",
	path: "/health",
	responses: {
		200: {
			content: { "application/json": { schema: successStatusSchema } },
			description: "Service is healthy",
		},
	},
});

const readyRoute = createRoute({
	method: "get",
	path: "/ready",
	responses: {
		200: {
			content: { "application/json": { schema: successStatusSchema } },
			description: "Service is ready",
		},
		503: {
			content: { "application/json": { schema: z.any() } },
			description: "Dependencies are unavailable",
		},
	},
});

const health = new OpenAPIHono<AppEnv>();

health.openapi(healthRoute, (c) =>
	successResponse(c, { status: "ok", service: "dispatchpilot-api" }),
);

health.openapi(readyRoute, async (c) => {
	try {
		await checkDatabaseConnection(1, 0);
		return successResponse(c, { status: "ok", service: "dispatchpilot-api" });
	} catch {
		return errorResponse(c, {
			status: 503,
			code: ErrorCode.SERVICE_UNAVAILABLE,
			message: "Service dependencies are unavailable",
		});
	}
});

export default health;
