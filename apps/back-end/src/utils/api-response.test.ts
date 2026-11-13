import assert from "node:assert/strict";
import test from "node:test";

import { Hono } from "hono";
import { apiErrorSchema } from "@dspv2/shared";

import { errorResponse } from "./api-response";

test("error responses use the shared API envelope", async () => {
	const app = new Hono();
	app.get("/", (c) =>
		errorResponse(c, {
			code: "VALIDATION_ERROR",
			message: "Invalid request",
			status: 422,
			details: { field: "email" },
		}),
	);

	const response = await app.request("/");
	const body = await response.json();
	assert.equal(response.status, 422);
	assert.deepEqual(apiErrorSchema.parse(body), {
		success: false,
		error: {
			code: "VALIDATION_ERROR",
			message: "Invalid request",
			details: { field: "email" },
		},
	});
});
