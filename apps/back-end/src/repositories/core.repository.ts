import { and, asc, desc, eq, lt } from "drizzle-orm";

import { db } from "@/db";
import {
	approvals,
	assetEvents,
	assets,
	assignments,
	buildings,
	contracts,
	events,
	jobs,
	slaRules,
	settings,
	skills,
	technicians,
	users,
} from "@/db/schema";

export class CoreRepository {
	async listJobs(filters: {
		status?: string;
		urgency?: string;
		limit: number;
		cursor?: string;
	}) {
		const conditions = [
			filters.status ? eq(jobs.status, filters.status as never) : undefined,
			filters.urgency ? eq(jobs.urgency, filters.urgency as never) : undefined,
			filters.cursor ? lt(jobs.createdAt, new Date(filters.cursor)) : undefined,
		].filter(Boolean);
		const rows = await db
			.select({
				job: jobs,
				building: buildings,
				contract: contracts,
			})
			.from(jobs)
			.leftJoin(buildings, eq(jobs.buildingId, buildings.id))
			.leftJoin(contracts, eq(jobs.contractId, contracts.id))
			.where(conditions.length ? and(...conditions) : undefined)
			.orderBy(desc(jobs.createdAt))
			.limit(filters.limit + 1);
		const hasMore = rows.length > filters.limit;
		const items = rows.slice(0, filters.limit);
		return {
			items,
			nextCursor:
				hasMore && items.at(-1)?.job.createdAt
					? items.at(-1)?.job.createdAt.toISOString()
					: null,
		};
	}

	async getJob(id: string) {
		const [row] = await db
			.select({ job: jobs, building: buildings, contract: contracts })
			.from(jobs)
			.leftJoin(buildings, eq(jobs.buildingId, buildings.id))
			.leftJoin(contracts, eq(jobs.contractId, contracts.id))
			.where(eq(jobs.id, id))
			.limit(1);
		if (!row) return null;
		const jobAssignments = await db
			.select({
				assignment: assignments,
				technician: technicians,
				user: users,
			})
			.from(assignments)
			.innerJoin(technicians, eq(assignments.technicianId, technicians.id))
			.innerJoin(users, eq(technicians.userId, users.id))
			.where(eq(assignments.jobId, id))
			.orderBy(desc(assignments.createdAt));
		return { ...row, assignments: jobAssignments };
	}

	async getJobEvents(id: string) {
		return db
			.select()
			.from(events)
			.where(and(eq(events.subjectType, "job"), eq(events.subjectId, id)))
			.orderBy(desc(events.createdAt));
	}

	async listTechnicians() {
		const rows = await db
			.select({ technician: technicians, user: users })
			.from(technicians)
			.innerJoin(users, eq(technicians.userId, users.id))
			.orderBy(asc(users.name));
		const skillRows = await db.select().from(skills);
		return rows.map((row) => ({
			...row,
			skills: skillRows.filter(
				(skill) => skill.technicianId === row.technician.id,
			),
		}));
	}

	async getTechnician(id: string) {
		const [row] = await db
			.select({ technician: technicians, user: users })
			.from(technicians)
			.innerJoin(users, eq(technicians.userId, users.id))
			.where(eq(technicians.id, id))
			.limit(1);
		return row ?? null;
	}

	async listApprovals(status?: string) {
		return db
			.select()
			.from(approvals)
			.where(status ? eq(approvals.status, status as never) : undefined)
			.orderBy(desc(approvals.createdAt));
	}

	async listEvents(filters: {
		type?: string;
		subjectType?: string;
		limit: number;
		cursor?: string;
	}) {
		const conditions = [
			filters.type ? eq(events.type, filters.type) : undefined,
			filters.subjectType
				? eq(events.subjectType, filters.subjectType)
				: undefined,
			filters.cursor
				? lt(events.createdAt, new Date(filters.cursor))
				: undefined,
		].filter(Boolean);
		const rows = await db
			.select()
			.from(events)
			.where(conditions.length ? and(...conditions) : undefined)
			.orderBy(desc(events.createdAt))
			.limit(filters.limit + 1);
		const hasMore = rows.length > filters.limit;
		const items = rows.slice(0, filters.limit);
		return {
			items,
			nextCursor:
				hasMore && items.at(-1)?.createdAt
					? items.at(-1)?.createdAt.toISOString()
					: null,
		};
	}

	async listAssets() {
		return db
			.select({ asset: assets, building: buildings })
			.from(assets)
			.innerJoin(buildings, eq(assets.buildingId, buildings.id))
			.orderBy(asc(assets.type));
	}

	async getAsset(id: string) {
		const [asset] = await db
			.select({ asset: assets, building: buildings })
			.from(assets)
			.innerJoin(buildings, eq(assets.buildingId, buildings.id))
			.where(eq(assets.id, id))
			.limit(1);
		if (!asset) return null;
		const history = await db
			.select()
			.from(assetEvents)
			.where(eq(assetEvents.assetId, id))
			.orderBy(desc(assetEvents.createdAt));
		return { ...asset, history };
	}

	async listContracts() {
		return db
			.select({ contract: contracts, building: buildings })
			.from(contracts)
			.innerJoin(buildings, eq(contracts.buildingId, buildings.id))
			.orderBy(asc(contracts.customer));
	}

	async getContract(id: string) {
		const [contract] = await db
			.select({ contract: contracts, building: buildings })
			.from(contracts)
			.innerJoin(buildings, eq(contracts.buildingId, buildings.id))
			.where(eq(contracts.id, id))
			.limit(1);
		if (!contract) return null;
		const rules = await db
			.select()
			.from(slaRules)
			.where(eq(slaRules.contractId, id));
		return { ...contract, rules };
	}

	async listJobsForTechnician(technicianId: string) {
		return db
			.select({ job: jobs, assignment: assignments, building: buildings })
			.from(assignments)
			.innerJoin(jobs, eq(assignments.jobId, jobs.id))
			.innerJoin(buildings, eq(jobs.buildingId, buildings.id))
			.where(eq(assignments.technicianId, technicianId))
			.orderBy(asc(assignments.startAt));
	}

	async getSettings() {
		const [row] = await db.select().from(settings).limit(1);
		return row ?? null;
	}

	async board() {
		const rows = await db
			.select({
				status: jobs.status,
				urgency: jobs.urgency,
				safety: jobs.safetyFlag,
			})
			.from(jobs);
		return {
			total: rows.length,
			open: rows.filter((row) => !["done", "cancelled"].includes(row.status))
				.length,
			late: rows.filter((row) => row.status === "late").length,
			emergency: rows.filter((row) => row.safety || row.urgency === "emergency")
				.length,
			needsAttention: rows.filter(
				(row) =>
					row.safety || row.status === "attention" || row.status === "late",
			).length,
		};
	}
}

export const coreRepository = new CoreRepository();
