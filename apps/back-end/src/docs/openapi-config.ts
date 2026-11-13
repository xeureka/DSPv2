import type { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

export const setupOpenAPI = (app: OpenAPIHono) => {
	app.doc("/openapi.json", {
		openapi: "3.1.0",
		info: {
			version: "1.0.0",
			title: "DSPV2 API",
			description: "API documentation for the DSPv2 system",
		},
	});

	app.get(
		"/docs",
		apiReference({
			theme: "purple",
			pageTitle: "DSPv2 API Documentation",
			spec: {
				url: "/openapi.json",
			},
		}),
	);
};
