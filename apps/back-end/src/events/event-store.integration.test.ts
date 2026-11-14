import "dotenv/config";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { eq } from "drizzle-orm";

import { db, pool } from "@/db";
import { events } from "@/db/schema";
import { appendEvent, withEventTransaction } from "./event-store";

const key = "test:event-store:" + Date.now();

test("event store is idempotent and rolls back with the state transaction", async () => {
	const first = await appendEvent({
		type: "job.received",
		subjectType: "job",
		payload: { source: "integration-test" },
		reasoning: "Integration test event",
		autonomy: "auto",
		idempotencyKey: key,
	});
	const second = await appendEvent({
		type: "job.received",
		subjectType: "job",
		payload: { source: "integration-test" },
		reasoning: "Integration test event",
		autonomy: "auto",
		idempotencyKey: key,
	});
	assert.equal(second.id, first.id);

	const rollbackKey = key + ":rollback";
	await assert.rejects(
		withEventTransaction(async (executor) => {
			await appendEvent(
				{
					type: "job.extracted",
					subjectType: "job",
					payload: { source: "integration-test" },
					reasoning: "Rollback test event",
					autonomy: "approved",
					idempotencyKey: rollbackKey,
				},
				executor,
			);
			throw new Error("rollback");
		}),
	);

	const rolledBack = await db
		.select({ id: events.id })
		.from(events)
		.where(eq(events.idempotencyKey, rollbackKey));
	assert.equal(rolledBack.length, 0);
});

after(async () => {
	await db.delete(events).where(eq(events.idempotencyKey, key));
	await pool.end();
});
