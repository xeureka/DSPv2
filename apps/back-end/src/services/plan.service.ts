import { and, asc, eq, inArray } from "drizzle-orm";
import { diffPlans, plan, type JobInput, type Plan, type Problem, type Stop } from "@dspv2/engine";
import { db } from "@/db";
import { approvals, assignments, jobs, planProposals, skills, technicians } from "@/db/schema";
import { appendEvent, withEventTransaction } from "@/events/event-store";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";

const activeJobStatuses = ["received", "triaged", "proposed", "assigned", "en_route", "on_site", "late"] as const;

async function context(): Promise<{ problem: Problem; before: Plan }> {
	const techRows = await db.select().from(technicians).orderBy(asc(technicians.id));
	const skillRows = await db.select().from(skills);
	const jobRows = await db.select().from(jobs).where(inArray(jobs.status, activeJobStatuses));
	const assignmentRows = await db.select().from(assignments).where(inArray(assignments.jobId, jobRows.map((row) => row.id)));
	const toMinutes = (value: Date) => value.getUTCHours() * 60 + value.getUTCMinutes();
	const routes = new Map<string, Stop[]>();
	for (const tech of techRows) routes.set(tech.id, []);
	for (const assignment of assignmentRows) routes.get(assignment.technicianId)?.push({ jobId: assignment.jobId, start: toMinutes(assignment.startAt), end: toMinutes(assignment.endAt) });
	const techniciansInput = techRows.map((tech) => ({ id: tech.id, position: { latitude: tech.latitude, longitude: tech.longitude }, shiftStart: Number(tech.shiftStart.slice(0, 2)) * 60 + Number(tech.shiftStart.slice(3)), shiftEnd: Number(tech.shiftEnd.slice(0, 2)) * 60 + Number(tech.shiftEnd.slice(3)), skills: skillRows.filter((skill) => skill.technicianId === tech.id).map((skill) => skill.name), currentRoute: routes.get(tech.id) }));
	const jobInputs: JobInput[] = jobRows.map((job) => ({ id: job.id, location: { latitude: job.latitude, longitude: job.longitude }, skill: job.skillRequired, medianMinutes: 60, p90Minutes: 90, slaDue: job.slaDueAt ? toMinutes(job.slaDueAt) : 1_440, urgency: job.urgency === "emergency" ? 3 : job.urgency === "high" ? 2 : 1, promised: Boolean(job.notes?.includes("promised")) }));
	const problem: Problem = { technicians: techniciansInput, jobs: jobInputs, now: new Date().getUTCHours() * 60 + new Date().getUTCMinutes(), weights: { disruption: 8 }, iterationBudget: 250, seed: 42 };
	const beforeRoutes = techniciansInput.map((tech) => ({ technicianId: tech.id, stops: [...(tech.currentRoute ?? [])] }));
	const beforeAssignments: Record<string, string> = {};
	for (const route of beforeRoutes) for (const stop of route.stops) beforeAssignments[stop.jobId] = route.technicianId;
	const before: Plan = { routes: beforeRoutes, assignments: beforeAssignments, cost: { travel: 0, slaLateness: 0, overtime: 0, imbalance: 0, disruption: 0, total: 0 } };
	return { problem, before };
}

export class PlanService {
	async createDelayProposal(technicianId: string, minutes: number, userId?: string) {
		const { problem, before } = await context();
		const tech = problem.technicians.find((item) => item.id === technicianId);
		if (!tech) throw new AppError("Technician not found", 404, ErrorCode.NOT_FOUND);
		tech.position = { ...tech.position };
		tech.currentRoute = tech.currentRoute?.map((stop, index) => index === 0 ? { ...stop, start: stop.start + minutes, end: stop.end + minutes } : stop);
		const replanProblem: Problem = { ...problem, technicians: problem.technicians.map((item) => ({ ...item, currentRoute: undefined })) };
		const after = plan(replanProblem, before);
		const diff = diffPlans(before, after);
		return withEventTransaction(async (tx) => {
			const [proposal] = await tx.insert(planProposals).values({ before: before as unknown as Record<string, unknown>, after: after as unknown as Record<string, unknown>, diff: diff as unknown as Record<string, unknown>, reasons: diff.reasons, impact: { minutes, technicianId, costBefore: before.cost.total, costAfter: after.cost.total }, proposedBy: userId }).returning();
			if (!proposal) throw new AppError("Plan proposal creation failed", 500, ErrorCode.INTERNAL_SERVER_ERROR);
			await tx.insert(approvals).values({ type: "replan", subjectType: "plan_proposal", subjectId: proposal.id, context: { technicianId, minutes, diff }, reasoning: diff.reasons.join(" "), status: "pending" });
			await appendEvent({ type: "plan.proposed", subjectType: "plan_proposal", subjectId: proposal.id, payload: { technicianId, minutes, diff }, reasoning: diff.reasons.join(" "), autonomy: "auto", idempotencyKey: `plan-proposal:${technicianId}:${minutes}:${Math.floor(Date.now() / 60_000)}` }, tx);
			return proposal;
		});
	}

	list(status?: "pending" | "approved" | "rejected") { return db.select().from(planProposals).where(status ? eq(planProposals.status, status) : undefined).orderBy(asc(planProposals.createdAt)); }
	async get(id: string) { const [proposal] = await db.select().from(planProposals).where(eq(planProposals.id, id)).limit(1); if (!proposal) throw new AppError("Plan proposal not found", 404, ErrorCode.NOT_FOUND); return proposal; }

	async decide(id: string, decision: "approved" | "rejected", userId: string) {
		return withEventTransaction(async (tx) => {
			const [proposal] = await tx.select().from(planProposals).where(eq(planProposals.id, id)).limit(1);
			if (!proposal) throw new AppError("Plan proposal not found", 404, ErrorCode.NOT_FOUND);
			if (proposal.status !== "pending") { if (proposal.status === decision) return proposal; throw new AppError("Plan is no longer pending", 409, ErrorCode.PLAN_NOT_PENDING); }
			if (decision === "approved") {
				const after = proposal.after as unknown as Plan;
				for (const route of after.routes) for (const stop of route.stops) {
					const [existing] = await tx.select().from(assignments).where(eq(assignments.jobId, stop.jobId)).orderBy(asc(assignments.createdAt)).limit(1);
					if (existing) { const day = new Date(); day.setUTCHours(0, 0, 0, 0); await tx.update(assignments).set({ technicianId: route.technicianId, startAt: new Date(day.getTime() + stop.start * 60_000), endAt: new Date(day.getTime() + stop.end * 60_000), status: "confirmed" }).where(eq(assignments.id, existing.id)); }
				}
			}
			const [updated] = await tx.update(planProposals).set({ status: decision, decidedBy: userId, decidedAt: new Date() }).where(and(eq(planProposals.id, id), eq(planProposals.status, "pending"))).returning();
			if (!updated) throw new AppError("Plan is no longer pending", 409, ErrorCode.PLAN_NOT_PENDING);
			await appendEvent({ type: decision === "approved" ? "plan.approved" : "plan.rejected", subjectType: "plan_proposal", subjectId: id, payload: { decision }, reasoning: decision === "approved" ? "Dispatcher approved the proposed re-plan." : "Dispatcher rejected the proposed re-plan.", autonomy: "approved", idempotencyKey: `plan-decision:${id}:${decision}` }, tx);
			return updated;
		});
	}
}
export const planService = new PlanService();
