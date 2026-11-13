import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { googleSignInConfigured } from "@/lib/auth";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";

const route = createRoute({
	method: "get",
	path: "/auth/config",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(true),
						data: z.object({ googleEnabled: z.boolean() }),
					}),
				},
			},
			description: "Publicly available sign-in provider configuration",
		},
	},
});

const authConfig = new OpenAPIHono<AppEnv>();

authConfig.openapi(route, (c) =>
	successResponse(c, { googleEnabled: googleSignInConfigured }),
);

export default authConfig;
