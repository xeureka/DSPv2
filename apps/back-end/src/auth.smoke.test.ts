import "dotenv/config";
import test from "node:test";

const databaseUrl = process.env.TEST_DATABASE_URL;
const email = process.env.TEST_AUTH_EMAIL;
const password = process.env.TEST_AUTH_PASSWORD;

if (!databaseUrl || !email || !password) {
	test("Better Auth sign-in smoke requires TEST_DATABASE_URL and test credentials", () => {
		throw new Error(
			"Set TEST_DATABASE_URL, TEST_AUTH_EMAIL, and TEST_AUTH_PASSWORD to run the auth smoke test",
		);
	});
} else {
	test("Better Auth signs in against the disposable test database", async () => {
		process.env.DATABASE_URL = databaseUrl;
		process.env.NODE_ENV = "test";
		process.env.WEB_APP_URL ??= "http://localhost:5173";
		process.env.CORS_ORIGINS ??= "http://localhost:5173";
		const { auth } = await import("./lib/auth");
		const result = await auth.api.signInEmail({
			body: { email, password },
		});
		if (!result.user) throw new Error("Better Auth did not return a user");
	});
}
