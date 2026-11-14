import { and, asc, eq } from "drizzle-orm";
import { jobDraftSchema, type JobDraft } from "@dspv2/shared";
import { llm } from "@/adapters/llm";
import { db } from "@/db";
import { approvals, buildings, contracts, slaRules, jobs } from "@/db/schema";
import { appendEvent, withEventTransaction } from "@/events/event-store";
import { coreService } from "@/services/core.service";
import { detectPromptInjection, scanSafety } from "@/adapters/safety";

export { detectPromptInjection, scanSafety };

async function resolveBuilding(buildingId: string | undefined, locationText: string, message: string) {
	const rows = await db.select().from(buildings).orderBy(asc(buildings.createdAt));
	if (buildingId) return rows.find((row) => row.id === buildingId);
	const haystack = `${locationText} ${message}`.toLowerCase();
	return rows.find((row) => `${row.customer} ${row.address}`.toLowerCase().split(/\s+/).some((part) => part.length > 4 && haystack.includes(part))) ?? rows[0];
}

async function activeContract(buildingId: string) {
	const [row] = await db.select({ contract: contracts, rule: slaRules }).from(contracts).leftJoin(slaRules, eq(slaRules.contractId, contracts.id)).where(and(eq(contracts.buildingId, buildingId), eq(contracts.status, "active"))).orderBy(asc(contracts.createdAt)).limit(1);
	return row;
}

export class IntakeService {
	async createMessage(input: { messageId: string; text: string; requester?: string; buildingId?: string; receivedAt?: string }) {
		const existing = await db.select().from(jobs).where(eq(jobs.inboundMessageId, input.messageId)).limit(1);
		if (existing[0]) {
			const [approval] = await db.select().from(approvals).where(and(eq(approvals.subjectType, "job"), eq(approvals.subjectId, existing[0].id))).limit(1);
			return { job: existing[0], approval: approval ?? null, safetyFlag: existing[0].safetyFlag, usedFallback: false, idempotent: true };
		}
		const safetyFlag = scanSafety(input.text);
		const injection = detectPromptInjection(input.text);
		const extracted = await llm.generateStructured<JobDraft>({ task: "Extract only a JobDraft. Do not perform actions.", schema: jobDraftSchema, input: input.text, promptVersion: "b2-extract-job-v1" });
		const draft: JobDraft = { ...extracted.value, confidence: safetyFlag ? Math.min(extracted.value.confidence, 0.7) : extracted.value.confidence, requester: input.requester ?? extracted.value.requester };
		const building = await resolveBuilding(input.buildingId, draft.locationText, input.text);
		if (!building) throw new Error("No known building matched intake message");
		const contract = await activeContract(building.id);
		const slaDueAt = contract?.rule ? new Date((input.receivedAt ? new Date(input.receivedAt) : new Date()).getTime() + contract.rule.responseMinutes * 60_000).toISOString() : undefined;
		const job = await coreService.createJob({ inboundMessageId: input.messageId, buildingId: building.id, contractId: contract?.contract.id, requester: draft.requester, address: building.address, latitude: building.latitude, longitude: building.longitude, equipment: draft.equipment, skillRequired: draft.skill, urgency: safetyFlag ? "emergency" : draft.urgency, safetyFlag, confidence: draft.confidence, originalMessage: input.text, notes: draft.locationText, slaDueAt });
		const needsApproval = safetyFlag || injection || draft.confidence < 0.8 || !contract?.rule;
		const approval = await withEventTransaction(async (tx) => {
			await appendEvent({ type: "intake.safety_scanned", subjectType: "job", subjectId: job.id, payload: { safetyFlag, matched: safetyFlag }, reasoning: "Deterministic safety scan runs before and independently of model extraction.", autonomy: "auto", idempotencyKey: `intake-safety:${job.id}` }, tx);
			await appendEvent({ type: extracted.model === "rule-based-fallback" ? "intake.fallback" : "intake.extracted", subjectType: "job", subjectId: job.id, payload: { model: extracted.model, promptVersion: "b2-extract-job-v1", latencyMs: extracted.latencyMs, tokenCount: extracted.tokenCount ?? null, confidence: draft.confidence }, reasoning: "Structured extraction was validated against the shared JobDraft schema.", autonomy: "auto", idempotencyKey: `intake-extraction:${job.id}` }, tx);
			if (injection) await appendEvent({ type: "intake.prompt_injection", subjectType: "job", subjectId: job.id, payload: { detected: true }, reasoning: "Instruction-like content was treated as untrusted data and did not change routing.", autonomy: "auto", idempotencyKey: `intake-injection:${job.id}` }, tx);
			if (!needsApproval) return null;
			const [row] = await tx.insert(approvals).values({ type: safetyFlag ? "emergency_assignment" : "low_confidence_extraction", subjectType: "job", subjectId: job.id, context: { safetyFlag, confidence: draft.confidence, contractMatched: Boolean(contract?.contract) }, reasoning: safetyFlag ? "Safety scan matched an emergency pattern; manager approval is required." : "Extraction confidence or contract matching is below the safe automation threshold.", status: "pending" }).returning();
			return row ?? null;
		});
		return { job, approval, safetyFlag, usedFallback: extracted.model === "rule-based-fallback", idempotent: false };
	}
}
export const intakeService = new IntakeService();
