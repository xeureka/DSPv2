import "dotenv/config";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { and, eq } from "drizzle-orm";

import app from "./app";
import { db, pool } from "./db";
import { events, jobs } from "./db/schema";

const origin = process.env.WEB_APP_URL ?? "http://localhost:5173";
const seedDefaults = {
	manager: ["manager@dispatchpilot.local", "DispatchPilotManager123!"],
	dispatcher: ["dispatcher@dispatchpilot.local", "DispatchPilotDispatcher123!"],
	technician: ["technician@dispatchpilot.local", "DispatchPilotTechnician123!"],
} as const;
const credentials = {
	manager: [
		process.env.SEED_MANAGER_EMAIL ?? seedDefaults.manager[0],
		process.env.SEED_MANAGER_PASSWORD ?? seedDefaults.manager[1],
	],
	dispatcher: [
		process.env.SEED_DISPATCHER_EMAIL ?? seedDefaults.dispatcher[0],
		process.env.SEED_DISPATCHER_PASSWORD ?? seedDefaults.dispatcher[1],
	],
	technician: [
		process.env.SEED_TECHNICIAN_EMAIL ?? seedDefaults.technician[0],
		process.env.SEED_TECHNICIAN_PASSWORD ?? seedDefaults.technician[1],
	],
} as const;

async function request(path: string, init: RequestInit = {}, cookie?: string) {
	return app.fetch(
		new Request("http://localhost:3011/api/v1" + path, {
			...init,
			headers: {
				origin,
				"content-type": "application/json",
				...(cookie ? { cookie } : {}),
				...init.headers,
			},
		}),
	);
}

async function login(role: keyof typeof credentials) {
	const [email, password] = credentials[role];
	const response = await app.fetch(
		new Request("http://localhost:3011/api/auth/sign-in/email", {
			method: "POST",
			headers: { origin, "content-type": "application/json" },
			body: JSON.stringify({ email, password, rememberMe: true }),
		}),
	);
	assert.equal(response.status, 200);
	const cookie = response.headers.getSetCookie()[0]?.split(";", 1)[0];
	assert.ok(cookie);
	return cookie;
}

test("B1 role matrix protects manager and dispatcher routes", async () => {
	const manager = await login("manager");
	const dispatcher = await login("dispatcher");
	const technician = await login("technician");
	assert.equal((await request("/board", {}, manager)).status, 200);
	assert.equal((await request("/board", {}, dispatcher)).status, 200);
	assert.equal((await request("/board", {}, technician)).status, 403);
	assert.equal((await request("/settings", {}, manager)).status, 200);
	assert.equal((await request("/settings", {}, dispatcher)).status, 403);
});

test("B1 jobs are idempotent and invalid workflow transitions are rejected", async () => {
	const manager = await login("manager");
	const inboundMessageId = "b1-test-" + Date.now();
	const body = {
		inboundMessageId,
		buildingId: "10000000-0000-4000-8000-000000000001",
		requester: "B1 integration test",
		address: "1 Bole Avenue, Addis Ababa",
		latitude: 8.995,
		longitude: 38.788,
		equipment: "passenger lift",
		skillRequired: "elevator",
		urgency: "normal",
		safetyFlag: false,
		confidence: 0.95,
		originalMessage: "Integration test job",
	};
	const first = await request(
		"/jobs",
		{ method: "POST", body: JSON.stringify(body) },
		manager,
	);
	const second = await request(
		"/jobs",
		{ method: "POST", body: JSON.stringify(body) },
		manager,
	);
	assert.equal(first.status, 200);
	assert.equal(second.status, 200);
	const firstBody = (await first.json()) as { data: { id: string } };
	const secondBody = (await second.json()) as { data: { id: string } };
	assert.equal(firstBody.data.id, secondBody.data.id);

	const assigned = await request(
		"/jobs/50000000-0000-4000-8000-000000000002/approve",
		{ method: "POST" },
		manager,
	);
	assert.equal(assigned.status, 409);
	const page = await request("/jobs?limit=1", {}, manager);
	assert.equal(page.status, 200);
	const pageBody = (await page.json()) as {
		data: { items: unknown[]; nextCursor: string | null };
	};
	assert.equal(pageBody.data.items.length, 1);
});

after(async () => {
	await db
		.delete(events)
		.where(
			and(
				eq(events.subjectType, "job"),
				eq(events.reasoning, "Job accepted through the core intake API."),
			),
		);
	await db.delete(jobs).where(eq(jobs.requester, "B1 integration test"));
	await pool.end();
});
