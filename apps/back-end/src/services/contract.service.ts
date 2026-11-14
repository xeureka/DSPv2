import { eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { contracts, events, jobs, slaRules } from "@/db/schema";
import { appendEvent, withEventTransaction } from "@/events/event-store";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";

export class ContractService {
	async approve(id: string, userId: string) {
		return withEventTransaction(async (tx) => {
			const [contract] = await tx.select().from(contracts).where(eq(contracts.id, id)).limit(1);
			if (!contract) throw new AppError("Contract not found", 404, ErrorCode.NOT_FOUND);
			if (contract.status === "active") return contract;
			const [updated] = await tx.update(contracts).set({ status: "active" }).where(eq(contracts.id, id)).returning();
			await tx.update(slaRules).set({ approvedAt: new Date(), approvedBy: userId }).where(eq(slaRules.contractId, id));
			await appendEvent({ type: "contract.approved", subjectType: "contract", subjectId: id, payload: { contractId: id }, reasoning: "Manager approved the contract rules; they are now enforceable.", autonomy: "approved", idempotencyKey: `contract-approved:${id}` }, tx);
			return updated;
		});
	}

	async evidencePack() {
		const rows = await db.select({ event: events, job: jobs }).from(events).leftJoin(jobs, eq(events.subjectId, jobs.id)).where(gte(events.createdAt, new Date(Date.now() - 30 * 86_400_000))).orderBy(events.createdAt);
		const header = "timestamp,event_type,subject_type,subject_id,reasoning,autonomy";
		const csv = [header, ...rows.map(({ event }) => [event.createdAt.toISOString(), event.type, event.subjectType, event.subjectId ?? "", event.reasoning.replaceAll('"', '""'), event.autonomy].map((value) => `"${value}"`).join(","))].join("\n");
		return { format: "csv", generatedAt: new Date().toISOString(), rows: rows.length, csv };
	}
}
export const contractService = new ContractService();
