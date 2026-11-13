import "dotenv/config";
import assert from "node:assert/strict";
import { after, test } from "node:test";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	test("auth integration requires DATABASE_URL", () => {
		assert.fail("DATABASE_URL is required");
	});
} else {
	process.env.NODE_ENV = "test";
	process.env.WEB_APP_URL ??= "http://localhost:5173";
	process.env.CORS_ORIGINS ??= "http://localhost:5173";

	const load = async () => {
		const [{ auth }, { default: app }, { db, pool }, { users, accounts }] =
			await Promise.all([
				import("./lib/auth"),
				import("./app"),
				import("./db"),
				import("./db/schema"),
			]);
		return { auth, app, db, pool, users, accounts };
	};

	const request = async (
		app: { fetch: (request: Request) => Response | Promise<Response> },
		path: string,
		init: RequestInit = {},
	) =>
		app.fetch(
			new Request(`http://localhost:3011${path}`, {
				...init,
				headers: {
					"content-type": "application/json",
					...init.headers,
				},
			}),
		);

	test("seed is idempotent and preserves existing password hashes", async () => {
		const { db, users, accounts } = await load();
		const { eq } = await import("drizzle-orm");
		const { seedStaffUsers } = await import("./db/seed");
		const { getSeedUsers } = await import("./db/seed-config");
		const email = getSeedUsers()[0]?.email;
		assert.ok(email);
		const before = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email));
		const beforeAccount = before[0]
			? await db
					.select({ password: accounts.password })
					.from(accounts)
					.where(eq(accounts.userId, before[0].id))
					.limit(1)
			: [];
		await seedStaffUsers();
		const afterRows = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email));
		const seededUser = afterRows[0];
		assert.ok(seededUser);
		const afterAccount = await db
			.select({ password: accounts.password })
			.from(accounts)
			.where(eq(accounts.userId, seededUser.id))
			.limit(1);
		assert.equal(afterRows.length, 1);
		assert.equal(afterAccount.length, 1);
		const seededAccount = afterAccount[0];
		assert.ok(seededAccount);
		if (beforeAccount[0]?.password) {
			assert.equal(seededAccount.password, beforeAccount[0].password);
		}
	});

	test("sign-in, role access, sign-out invalidation, and parity work for all roles", async () => {
		const { app } = await load();
		const { getSeedUsers } = await import("./db/seed-config");
		for (const { role, email, password } of getSeedUsers()) {
			const signIn = await request(app, "/api/auth/sign-in/email", {
				method: "POST",
				body: JSON.stringify({ email, password, rememberMe: true }),
			});
			assert.equal(signIn.status, 200);
			const cookie = signIn.headers.getSetCookie()[0]?.split(";", 1)[0];
			assert.ok(cookie);
			const session = await request(app, "/api/auth/get-session", {
				headers: { cookie },
			});
			const sessionBody = (await session.json()) as {
				user: { role: string };
			};
			assert.equal(sessionBody.user.role, role);
			const protectedResponse = await request(app, "/api/v1/me", {
				headers: { cookie },
			});
			assert.equal(protectedResponse.status, 200);
			const signOut = await request(app, "/api/auth/sign-out", {
				method: "POST",
				headers: { cookie },
				body: "{}",
			});
			assert.equal(signOut.status, 200);
			const invalidated = await request(app, "/api/v1/me", {
				headers: { cookie },
			});
			assert.equal(invalidated.status, 401);
		}
		const wrong = await request(app, "/api/auth/sign-in/email", {
			method: "POST",
			body: JSON.stringify({
				email: getSeedUsers()[0]?.email,
				password: "not-the-password",
			}),
		});
		const unknown = await request(app, "/api/auth/sign-in/email", {
			method: "POST",
			body: JSON.stringify({
				email: "unknown@dispatch.com",
				password: "not-the-password",
			}),
		});
		assert.equal(wrong.status, unknown.status);
		const wrongBody = (await wrong.json()) as { message: string };
		const unknownBody = (await unknown.json()) as { message: string };
		assert.equal(wrongBody.message, unknownBody.message);
	});

	test("public sign-up cannot set a role or create an account", async () => {
		const { app } = await load();
		const response = await request(app, "/api/auth/sign-up/email", {
			method: "POST",
			body: JSON.stringify({
				name: "Not Allowed",
				email: "not-allowed@dispatch.com",
				password: "not-a-real-password",
				role: "manager",
			}),
		});
		assert.equal(response.status, 400);
	});

	test("protected route returns the shared 401 envelope without a session", async () => {
		const { app } = await load();
		const response = await request(app, "/api/v1/me");
		const body = (await response.json()) as {
			success: boolean;
			error: { code: string };
		};
		assert.equal(response.status, 401);
		assert.equal(body.success, false);
		assert.equal(typeof body.error.code, "string");
	});

	test("Better Auth publishes its complete OpenAPI schema", async () => {
		const { app } = await load();
		const response = await request(app, "/api/auth/open-api/generate-schema");
		assert.equal(response.status, 200);
		const body = (await response.json()) as {
			paths: Record<string, unknown>;
		};
		assert.ok(body.paths["/sign-in/email"]);
		assert.ok(body.paths["/get-session"]);
		assert.ok(body.paths["/sign-out"]);
	});

	after(async () => {
		const { pool } = await load();
		await pool.end();
	});
}
