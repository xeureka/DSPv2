import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL = "postgresql://localhost/dispatchpilot";
process.env.BETTER_AUTH_SECRET = "a".repeat(32);
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.WEB_APP_URL = "http://localhost:5173";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { parseEnv } = await import("./env");

test("environment validation accepts the minimum runtime configuration", () => {
	const result = parseEnv({
		NODE_ENV: "test",
		DATABASE_URL: "postgresql://localhost/dispatchpilot",
		BETTER_AUTH_SECRET: "a".repeat(32),
		BETTER_AUTH_URL: "http://localhost:3001",
		WEB_APP_URL: "http://localhost:5173",
		CORS_ORIGINS: "http://localhost:5173",
	});

	assert.equal(result.success, true);
});

test("environment validation rejects short auth secrets", () => {
	const result = parseEnv({
		DATABASE_URL: "postgresql://localhost/dispatchpilot",
		BETTER_AUTH_SECRET: "short",
		BETTER_AUTH_URL: "http://localhost:3001",
		WEB_APP_URL: "http://localhost:5173",
		CORS_ORIGINS: "http://localhost:5173",
	});

	assert.equal(result.success, false);
});
