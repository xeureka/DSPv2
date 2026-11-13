import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { sessionMiddleware } from "@/middlewares/session.middleware";
import { requireRole } from "@/middlewares/require-role.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";

const meRoute = createRoute({
	method: "get",
	path: "/me",
	middleware: [sessionMiddleware, requireRole()],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(true),
						data: z.object({
							id: z.string(),
							email: z.string(),
							name: z.string(),
							role: z.enum(["manager", "dispatcher", "technician"]),
						}),
					}),
				},
			},
			description: "Return the authenticated staff user",
		},
	},
});

const me = new OpenAPIHono<AppEnv>();

me.openapi(meRoute, (c) => {
	const user = c.get("user");
	if (!user) throw new Error("Authenticated user missing after role check");
	return successResponse(c, {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role as "manager" | "dispatcher" | "technician",
	});
});

export default me;
