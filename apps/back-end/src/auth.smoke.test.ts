import "dotenv/config";
import { after } from "node:test";
import test from "node:test";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.SEED_MANAGER_EMAIL || "manager@dispatchpilot.local";
const password =
	process.env.SEED_MANAGER_PASSWORD || "DispatchPilotManager123!";

if (!databaseUrl) {
	test("Better Auth sign-in smoke requires DATABASE_URL", () => {
		throw new Error(
			"Set DATABASE_URL and seed the default manager before running the auth smoke test",
		);
	});
} else {
	test("Better Auth signs in against DATABASE_URL", async () => {
		process.env.NODE_ENV = "test";
		process.env.WEB_APP_URL ??= "http://localhost:5173";
		process.env.CORS_ORIGINS ??= "http://localhost:5173";
		const { auth } = await import("./lib/auth");
		const result = await auth.api.signInEmail({
			body: { email, password },
		});
		if (!result.user) throw new Error("Better Auth did not return a user");
	});

	after(async () => {
		const { pool } = await import("./db");
		await pool.end();
	});
}
