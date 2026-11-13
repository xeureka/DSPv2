import type { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

export const setupOpenAPI = (app: OpenAPIHono) => {
	app.doc("/openapi.json", {
		openapi: "3.1.0",
		info: {
			version: "1.0.0",
			title: "DispatchPilot API",
			description: "API documentation for DispatchPilot",
		},
	});

	app.get(
		"/docs",
		apiReference({
			theme: "purple",
			pageTitle: "DispatchPilot API Documentation",
			spec: {
				url: "/openapi.json",
			},
		}),
	);
};
