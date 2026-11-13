import { Scalar } from "@scalar/hono-api-reference";

export const scalarHandler = Scalar({
	url: "/api/openapi.json",
	theme: "saturn",
	pageTitle: "DSPv2 API Reference",
	favicon: "/favicon.ico",
});
