import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import type { EventType, UserRole } from "@dspv2/shared";

export type EventInput = {
	type: EventType;
	subjectType: string;
	subjectId?: string;
	payload: Record<string, unknown>;
	reasoning: string;
	autonomy: "auto" | "approved";
	idempotencyKey?: string;
};

type EventExecutor = Pick<typeof db, "insert" | "select" | "update">;

export async function appendEvent(
	input: EventInput,
	executor: EventExecutor = db,
) {
	const [event] = await executor
		.insert(events)
		.values({
			type: input.type,
			subjectType: input.subjectType,
			subjectId: input.subjectId,
			payload: input.payload,
			reasoning: input.reasoning,
			autonomy: input.autonomy,
			idempotencyKey: input.idempotencyKey,
		})
		.onConflictDoNothing({ target: events.idempotencyKey })
		.returning();

	if (event) return event;
	if (input.idempotencyKey) {
		const existing = await executor
			.select()
			.from(events)
			.where(eq(events.idempotencyKey, input.idempotencyKey))
			.limit(1);
		if (existing[0]) return existing[0];
	}
	throw new Error("Event insert returned no row");
}

export async function withEventTransaction<T>(
	work: (executor: EventExecutor) => Promise<T>,
) {
	return db.transaction(async (transaction) =>
		work(transaction as unknown as EventExecutor),
	);
}

export type EventActor = {
	userId: string;
	role: UserRole;
};
