import { and, asc, eq, inArray, lte, ne } from "drizzle-orm";

import { db } from "@/db";
import {
	approvals,
	assignments,
	buildings,
	events,
	jobs,
	settings,
	skills,
	technicians,
} from "@/db/schema";
import { appendEvent, withEventTransaction } from "@/events/event-store";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";
import { coreRepository } from "@/repositories/core.repository";
import { haversineDistanceKm } from "@/adapters/travel";

const transitions: Record<string, string[]> = {
	received: ["triaged", "cancelled"],
	triaged: ["proposed", "cancelled"],
	proposed: ["assigned", "cancelled"],
	assigned: ["en_route", "cancelled"],
	en_route: ["on_site", "late", "cancelled"],
	late: ["on_site", "done", "cancelled"],
	on_site: ["done", "cancelled"],
	open: ["triaged", "cancelled"],
	scheduled: ["assigned", "cancelled"],
	attention: ["triaged", "cancelled"],
	done: [],
	cancelled: [],
};

function notFound(resource: string): never {
	throw new AppError(resource + " not found", 404, ErrorCode.NOT_FOUND);
}

function invalidTransition(from: string, to: string): never {
	throw new AppError(
		"Cannot transition job from " + from + " to " + to,
		409,
		ErrorCode.INVALID_TRANSITION,
	);
}

function shiftMinutes(value: string) {
	const [hours = 0, minutes = 0] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

function isWithinShift(shiftStart: string, shiftEnd: string, now = new Date()) {
	const current = now.getUTCHours() * 60 + now.getUTCMinutes();
	const start = shiftMinutes(shiftStart);
	const end = shiftMinutes(shiftEnd);
	return start <= end
		? current >= start && current <= end
		: current >= start || current <= end;
}

export class CoreService {
	listJobs(filters: {
		status?: string;
		urgency?: string;
		limit: number;
		cursor?: string;
	}) {
		return coreRepository.listJobs(filters);
	}

	board() {
		return coreRepository.board();
	}

	async getJob(id: string) {
		return (await coreRepository.getJob(id)) ?? notFound("Job");
	}

	getJobEvents(id: string) {
		return coreRepository.getJobEvents(id);
	}

	async createJob(input: {
		inboundMessageId?: string;
		buildingId: string;
		assetId?: string;
		contractId?: string;
		requester: string;
		address: string;
		latitude: number;
		longitude: number;
		equipment: string;
		skillRequired: "elevator" | "refrigeration" | "chiller" | "split unit";
		urgency: "normal" | "high" | "emergency";
		safetyFlag: boolean;
		confidence: number;
		originalMessage: string;
		notes?: string;
		slaDueAt?: string;
	}) {
		return withEventTransaction(async (tx) => {
			const existing = input.inboundMessageId
				? await tx
						.select()
						.from(jobs)
						.where(eq(jobs.inboundMessageId, input.inboundMessageId))
						.limit(1)
				: [];
			if (existing[0]) return existing[0];
			const [building] = await tx
				.select({ id: buildings.id })
				.from(buildings)
				.where(eq(buildings.id, input.buildingId))
				.limit(1);
			if (!building) notFound("Building");
			const [job] = await tx
				.insert(jobs)
				.values({
					inboundMessageId: input.inboundMessageId,
					buildingId: input.buildingId,
					assetId: input.assetId,
					contractId: input.contractId,
					requester: input.requester,
					address: input.address,
					latitude: input.latitude,
					longitude: input.longitude,
					equipment: input.equipment,
					skillRequired: input.skillRequired,
					urgency: input.urgency,
					safetyFlag: input.safetyFlag,
					status: "received",
					confidence: input.confidence.toFixed(3),
					originalMessage: input.originalMessage,
					notes: input.notes,
					slaDueAt: input.slaDueAt ? new Date(input.slaDueAt) : undefined,
				})
				.returning();
			if (!job)
				throw new AppError(
					"Job creation failed",
					500,
					ErrorCode.INTERNAL_SERVER_ERROR,
				);
			await appendEvent(
				{
					type: "job.received",
					subjectType: "job",
					subjectId: job.id,
					payload: { inboundMessageId: input.inboundMessageId ?? null },
					reasoning: "Job accepted through the core intake API.",
					autonomy: "auto",
				},
				tx,
			);
			return job;
		});
	}

	async approveJob(id: string) {
		return this.transitionJob(
			id,
			"proposed",
			"Dispatcher approved the extracted job.",
		);
	}

	async transitionJob(id: string, to: string, reasoning: string) {
		return withEventTransaction(async (tx) => {
			const [job] = await tx
				.select()
				.from(jobs)
				.where(eq(jobs.id, id))
				.limit(1);
			if (!job) notFound("Job");
			if (job.status === to) return job;
			if (!transitions[job.status]?.includes(to))
				invalidTransition(job.status, to);
			const [updated] = await tx
				.update(jobs)
				.set({ status: to as never })
				.where(eq(jobs.id, id))
				.returning();
			await appendEvent(
				{
					type: to === "triaged" ? "job.triaged" : "job.extracted",
					subjectType: "job",
					subjectId: id,
					payload: { from: job.status, to },
					reasoning,
					autonomy: "approved",
				},
				tx,
			);
			return updated;
		});
	}

	async reassignJob(id: string) {
		return withEventTransaction(async (tx) => {
			const [job] = await tx
				.select()
				.from(jobs)
				.where(eq(jobs.id, id))
				.limit(1);
			if (!job) notFound("Job");
			const candidates = await tx
				.select({ technician: technicians, skill: skills })
				.from(technicians)
				.innerJoin(skills, eq(skills.technicianId, technicians.id))
				.where(
					and(
						eq(technicians.status, "available"),
						eq(skills.name, job.skillRequired),
					),
				);
			const eligible = candidates.filter(({ technician }) =>
				isWithinShift(technician.shiftStart, technician.shiftEnd),
			);
			const candidate = eligible.toSorted(
				(left, right) =>
					haversineDistanceKm(job, left.technician) -
					haversineDistanceKm(job, right.technician),
			)[0];
			if (!candidate)
				throw new AppError(
					"No eligible technician is available",
					409,
					ErrorCode.CONFLICT,
				);
			const startAt = new Date();
			const [assignment] = await tx
				.insert(assignments)
				.values({
					jobId: id,
					technicianId: candidate.technician.id,
					startAt,
					endAt: new Date(startAt.getTime() + 3600000),
					status: "confirmed",
					cost: {
						travel: 0,
						slaLateness: 0,
						overtime: 0,
						imbalance: 0,
						disruption: 0,
					},
				})
				.returning();
			await tx.update(jobs).set({ status: "assigned" }).where(eq(jobs.id, id));
			await appendEvent(
				{
					type: "assignment.confirmed",
					subjectType: "job",
					subjectId: id,
					payload: { technicianId: candidate.technician.id },
					reasoning:
						"Nearest eligible technician selected by the B1 simple assignment service.",
					autonomy: "approved",
				},
				tx,
			);
			return assignment;
		});
	}

	listTechnicians() {
		return coreRepository.listTechnicians();
	}

	async patchTechnician(
		id: string,
		input: {
			shiftStart?: string;
			shiftEnd?: string;
			status?: "available" | "busy" | "late";
		},
	) {
		if (!(await coreRepository.getTechnician(id))) notFound("Technician");
		return withEventTransaction(async (tx) => {
			const [row] = await tx
				.update(technicians)
				.set(input)
				.where(eq(technicians.id, id))
				.returning();
			await appendEvent(
				{
					type: "technician.status_changed",
					subjectType: "technician",
					subjectId: id,
					payload: input,
					reasoning: "Technician roster details updated.",
					autonomy: "approved",
				},
				tx,
			);
			return row;
		});
	}

	async statusTechnician(
		id: string,
		status: "on_my_way" | "running_late" | "done",
		minutes?: number,
	) {
		if (!(await coreRepository.getTechnician(id))) notFound("Technician");
		const nextTechnicianStatus =
			status === "running_late"
				? "late"
				: status === "done"
					? "available"
					: "busy";
		const nextJobStatus =
			status === "on_my_way"
				? "en_route"
				: status === "running_late"
					? "late"
					: "done";
		return withEventTransaction(async (tx) => {
			await tx
				.update(technicians)
				.set({ status: nextTechnicianStatus })
				.where(eq(technicians.id, id));
			await appendEvent(
				{
					type:
						status === "running_late"
							? "technician.late"
							: "technician.status_changed",
					subjectType: "technician",
					subjectId: id,
					payload: { status, minutes: minutes ?? null },
					reasoning: "Technician reported a status update.",
					autonomy: "approved",
				},
				tx,
			);
			const active = await tx
				.select({ job: jobs })
				.from(assignments)
				.innerJoin(jobs, eq(assignments.jobId, jobs.id))
				.where(
					and(
						eq(assignments.technicianId, id),
						inArray(jobs.status, ["assigned", "en_route", "on_site", "late"]),
					),
				);
			for (const row of active) {
				await tx
					.update(jobs)
					.set({ status: nextJobStatus })
					.where(eq(jobs.id, row.job.id));
				await appendEvent(
					{
						type:
							status === "running_late"
								? "technician.late"
								: "technician.status_changed",
						subjectType: "job",
						subjectId: row.job.id,
						payload: { technicianId: id, status, minutes: minutes ?? null },
						reasoning: "Technician reported a status update.",
						autonomy: "approved",
					},
					tx,
				);
			}
			return { technicianId: id, status, affectedJobs: active.length };
		});
	}

	listApprovals(status?: string) {
		return coreRepository.listApprovals(status);
	}

	async decideApproval(
		id: string,
		decision: "approved" | "rejected",
		userId: string,
	) {
		return withEventTransaction(async (tx) => {
			const [approval] = await tx
				.select()
				.from(approvals)
				.where(eq(approvals.id, id))
				.limit(1);
			if (!approval) notFound("Approval");
			if (approval.status === decision) return approval;
			if (approval.status !== "pending")
				invalidTransition(approval.status, decision);
			const [updated] = await tx
				.update(approvals)
				.set({ status: decision, decidedBy: userId, decidedAt: new Date() })
				.where(eq(approvals.id, id))
				.returning();
			await appendEvent(
				{
					type: decision === "approved" ? "plan.approved" : "plan.rejected",
					subjectType: approval.subjectType,
					subjectId: approval.subjectId ?? undefined,
					payload: { approvalId: id, decision },
					reasoning: "Approval queue decision recorded.",
					autonomy: "approved",
				},
				tx,
			);
			return updated;
		});
	}

	listEvents(filters: Parameters<typeof coreRepository.listEvents>[0]) {
		return coreRepository.listEvents(filters);
	}

	replayEvents(at: string) {
		return db
			.select()
			.from(events)
			.where(lte(events.createdAt, new Date(at)))
			.orderBy(asc(events.createdAt));
	}

	listAssets() {
		return coreRepository.listAssets();
	}

	async getAsset(id: string) {
		return (await coreRepository.getAsset(id)) ?? notFound("Asset");
	}

	listContracts() {
		return coreRepository.listContracts();
	}

	async getContract(id: string) {
		return (await coreRepository.getContract(id)) ?? notFound("Contract");
	}

	async compliance() {
		const rows = await db
			.select({ status: jobs.status, due: jobs.slaDueAt })
			.from(jobs)
			.where(ne(jobs.status, "cancelled"));
		const overdue = rows.filter(
			(row) => row.due && row.due.getTime() < Date.now(),
		).length;
		return {
			total: rows.length,
			atRisk: overdue,
			breached: rows.filter((row) => row.status === "late").length,
			hitRate: rows.length ? (rows.length - overdue) / rows.length : 1,
		};
	}

	async settings() {
		return (await coreRepository.getSettings()) ?? notFound("Settings");
	}

	async updateSettings(
		input: {
			autoPilot?: boolean;
			confidenceThreshold?: number;
			dryRun?: boolean;
		},
		userId: string,
	) {
		const current = await coreRepository.getSettings();
		if (!current) notFound("Settings");
		return withEventTransaction(async (tx) => {
			const [updated] = await tx
				.update(settings)
				.set({
					autoPilot: input.autoPilot ?? current.autoPilot,
					confidenceThreshold: String(
						input.confidenceThreshold ?? current.confidenceThreshold,
					),
					dryRun: input.dryRun ?? current.dryRun,
					updatedBy: userId,
				})
				.where(eq(settings.id, current.id))
				.returning();
			await appendEvent(
				{
					type: "settings.changed",
					subjectType: "settings",
					subjectId: current.id,
					payload: input,
					reasoning: "Manager changed autonomy settings.",
					autonomy: "approved",
				},
				tx,
			);
			return updated;
		});
	}

	async meJobs(userId: string) {
		const [technician] = await db
			.select()
			.from(technicians)
			.where(eq(technicians.userId, userId))
			.limit(1);
		return technician
			? coreRepository.listJobsForTechnician(technician.id)
			: [];
	}
}

export const coreService = new CoreService();
