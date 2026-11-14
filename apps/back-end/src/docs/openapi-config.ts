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
		externalDocs: {
			description: "Complete Better Auth endpoint schema",
			url: "/api/auth/open-api/generate-schema",
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
