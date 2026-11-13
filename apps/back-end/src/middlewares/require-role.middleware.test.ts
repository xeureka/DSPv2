import assert from "node:assert/strict";
import test from "node:test";

import { Hono } from "hono";

import type { AppEnv } from "@/types/hono";

process.env.DATABASE_URL = "postgresql://localhost/dispatchpilot";
process.env.BETTER_AUTH_SECRET = "a".repeat(32);
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.WEB_APP_URL = "http://localhost:5173";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { requireRole } = await import("./require-role.middleware");
const { errorHandler } = await import("./error-handler");

function appForRole(role: AppEnv["Variables"]["role"]) {
	const app = new Hono<AppEnv>();
	app.use("*", async (c, next) => {
		c.set("user", role ? ({ role } as never) : null);
		await next();
	});
	app.use("/manager", requireRole("manager"));
	app.get("/manager", (c) => c.json({ ok: true }));
	app.onError(errorHandler);
	return app;
}

test("role middleware permits an allowed role", async () => {
	const response = await appForRole("manager").request("/manager");
	assert.equal(response.status, 200);
});

test("role middleware rejects a disallowed role", async () => {
	const response = await appForRole("technician").request("/manager");
	const body = (await response.json()) as {
		error: { code: string };
	};
	assert.equal(response.status, 403);
	assert.equal(body.error.code, "FORBIDDEN");
});
