import { eq } from "drizzle-orm";

import { db, pool } from "@/db";
import {
	approvals,
	assetEvents,
	assets,
	assignments,
	buildings,
	contracts,
	durationStats,
	events,
	jobs,
	outbox,
	planProposals,
	settings,
	simulationRuns,
	skills,
	slaRules,
	technicians,
	users,
} from "@/db/schema";
import { getSeedUsers } from "@/db/seed-config";
import { auth } from "@/lib/auth";

export async function seedStaffUsers() {
	const context = await auth.$context;

	const linkCredentialAccount = async (userId: string, password: string) => {
		const passwordHash = await context.password.hash(password);
		await context.internalAdapter.linkAccount({
			userId,
			providerId: "credential",
			issuer: "local:credential",
			accountId: userId,
			password: passwordHash,
		});
	};

	for (const { role, email, name, password } of getSeedUsers()) {
		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing[0]) {
			await db
				.update(users)
				.set({ role, name })
				.where(eq(users.id, existing[0].id));
			const credentialAccount =
				await context.internalAdapter.findCredentialAccount(existing[0].id);
			if (!credentialAccount) {
				await linkCredentialAccount(existing[0].id, password);
			}
			continue;
		}

		const user = await context.internalAdapter.createUser(
			{ name, email, emailVerified: false, role },
			{ method: "email-password" },
		);
		await linkCredentialAccount(user.id, password);
	}

	console.log("Seeded one development user for each staff role.");
}

export async function seedDomainData() {
	const seedUsers = getSeedUsers();
	const userRows = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(
			eq(users.email, seedUsers[0]?.email ?? "manager@dispatchpilot.local"),
		);
	const manager = userRows[0];
	const allUsers = await db
		.select({ id: users.id, email: users.email })
		.from(users);
	const userIdFor = (email: string) =>
		allUsers.find((user) => user.email === email)?.id;
	if (!manager) throw new Error("Manager seed user was not found");

	const buildingRows = [
		{
			id: "10000000-0000-4000-8000-000000000001",
			customer: "Northstar Towers",
			address: "1 Bole Avenue, Addis Ababa",
			latitude: 8.995,
			longitude: 38.788,
		},
		{
			id: "10000000-0000-4000-8000-000000000002",
			customer: "Mercury Mall",
			address: "22 Africa Avenue, Addis Ababa",
			latitude: 9.005,
			longitude: 38.762,
		},
		{
			id: "10000000-0000-4000-8000-000000000003",
			customer: "Greenline Offices",
			address: "7 Churchill Road, Addis Ababa",
			latitude: 9.03,
			longitude: 38.75,
		},
	] as const;
	await db
		.insert(buildings)
		.values([...buildingRows])
		.onConflictDoNothing();

	const contractRows = [
		{
			id: "20000000-0000-4000-8000-000000000001",
			buildingId: buildingRows[0].id,
			customer: buildingRows[0].customer,
			tier: "gold" as const,
			status: "active" as const,
			sourcePdf: "seed://northstar-gold",
		},
		{
			id: "20000000-0000-4000-8000-000000000002",
			buildingId: buildingRows[1].id,
			customer: buildingRows[1].customer,
			tier: "silver" as const,
			status: "active" as const,
			sourcePdf: "seed://mercury-silver",
		},
		{
			id: "20000000-0000-4000-8000-000000000003",
			buildingId: buildingRows[2].id,
			customer: buildingRows[2].customer,
			tier: "bronze" as const,
			status: "pending_approval" as const,
			sourcePdf: "seed://greenline-bronze",
		},
	] as const;
	await db
		.insert(contracts)
		.values([...contractRows])
		.onConflictDoNothing();
	await db
		.insert(slaRules)
		.values([
			{
				id: "21000000-0000-4000-8000-000000000001",
				contractId: contractRows[0].id,
				responseMinutes: 30,
				resolutionMinutes: 240,
				callbackCap: 4,
				creditTerms: "Service credit after missed response target",
				approvedBy: manager.id,
				approvedAt: new Date("2026-01-02T08:00:00Z"),
			},
			{
				id: "21000000-0000-4000-8000-000000000002",
				contractId: contractRows[1].id,
				responseMinutes: 120,
				resolutionMinutes: 480,
				callbackCap: 3,
				creditTerms: "Review after repeated callbacks",
			},
			{
				id: "21000000-0000-4000-8000-000000000003",
				contractId: contractRows[2].id,
				responseMinutes: 240,
				resolutionMinutes: 1440,
				callbackCap: 2,
				creditTerms: "Pending manager approval",
			},
		])
		.onConflictDoNothing();

	const technicianRows = [
		{
			id: "30000000-0000-4000-8000-000000000001",
			userId: userIdFor(
				seedUsers[2]?.email ?? "technician@dispatchpilot.local",
			)!,
			shiftStart: "08:00",
			shiftEnd: "17:00",
			latitude: 9.01,
			longitude: 38.77,
			status: "available" as const,
		},
		{
			id: "30000000-0000-4000-8000-000000000002",
			userId: userIdFor(
				seedUsers[1]?.email ?? "dispatcher@dispatchpilot.local",
			)!,
			shiftStart: "09:00",
			shiftEnd: "18:00",
			latitude: 9.03,
			longitude: 38.75,
			status: "busy" as const,
		},
	] as const;
	if (technicianRows.some((technician) => !technician.userId)) {
		throw new Error("Technician seed users were not found");
	}
	await db
		.insert(technicians)
		.values([...technicianRows])
		.onConflictDoNothing();
	await db
		.insert(skills)
		.values([
			{
				id: "31000000-0000-4000-8000-000000000001",
				technicianId: technicianRows[0].id,
				name: "elevator",
				level: 5,
			},
			{
				id: "31000000-0000-4000-8000-000000000002",
				technicianId: technicianRows[0].id,
				name: "chiller",
				level: 3,
			},
			{
				id: "31000000-0000-4000-8000-000000000003",
				technicianId: technicianRows[1].id,
				name: "refrigeration",
				level: 4,
			},
			{
				id: "31000000-0000-4000-8000-000000000004",
				technicianId: technicianRows[1].id,
				name: "split unit",
				level: 4,
			},
		])
		.onConflictDoNothing();

	const assetRows = [
		{
			id: "40000000-0000-4000-8000-000000000001",
			buildingId: buildingRows[0].id,
			type: "passenger lift",
			healthScore: 62,
			installDate: "2018-04-12",
		},
		{
			id: "40000000-0000-4000-8000-000000000002",
			buildingId: buildingRows[0].id,
			type: "chiller",
			healthScore: 86,
			installDate: "2021-09-01",
		},
		{
			id: "40000000-0000-4000-8000-000000000003",
			buildingId: buildingRows[1].id,
			type: "cold room",
			healthScore: 74,
			installDate: "2020-02-14",
		},
	] as const;
	await db
		.insert(assets)
		.values([...assetRows])
		.onConflictDoNothing();

	const jobRows = [
		{
			id: "50000000-0000-4000-8000-000000000001",
			buildingId: buildingRows[0].id,
			assetId: assetRows[0].id,
			contractId: contractRows[0].id,
			requester: "Northstar reception",
			address: buildingRows[0].address,
			latitude: buildingRows[0].latitude,
			longitude: buildingRows[0].longitude,
			equipment: "passenger lift",
			skillRequired: "elevator" as const,
			urgency: "emergency" as const,
			safetyFlag: true,
			status: "received" as const,
			confidence: "0.990",
			originalMessage: "A person is trapped in the passenger lift.",
			notes: "Emergency path; dispatcher approval required.",
			slaDueAt: new Date("2026-01-02T08:30:00Z"),
		},
		{
			id: "50000000-0000-4000-8000-000000000002",
			buildingId: buildingRows[0].id,
			assetId: assetRows[1].id,
			contractId: contractRows[0].id,
			requester: "Northstar facilities",
			address: buildingRows[0].address,
			latitude: buildingRows[0].latitude,
			longitude: buildingRows[0].longitude,
			equipment: "chiller",
			skillRequired: "chiller" as const,
			urgency: "high" as const,
			safetyFlag: false,
			status: "assigned" as const,
			confidence: "0.960",
			originalMessage: "Chiller temperature is rising on level 4.",
			notes: "SLA-critical maintenance call.",
			slaDueAt: new Date("2026-01-02T10:00:00Z"),
		},
		{
			id: "50000000-0000-4000-8000-000000000003",
			buildingId: buildingRows[1].id,
			assetId: assetRows[2].id,
			contractId: contractRows[1].id,
			requester: "Mercury Mall operations",
			address: buildingRows[1].address,
			latitude: buildingRows[1].latitude,
			longitude: buildingRows[1].longitude,
			equipment: "cold room",
			skillRequired: "refrigeration" as const,
			urgency: "normal" as const,
			safetyFlag: false,
			status: "received" as const,
			confidence: "0.910",
			originalMessage: "Cold room is warmer than the set point.",
			notes: "Awaiting deterministic assignment.",
			slaDueAt: new Date("2026-01-02T13:00:00Z"),
		},
	] as const;
	await db
		.insert(jobs)
		.values([...jobRows])
		.onConflictDoNothing();
	for (const job of jobRows) {
		await db
			.update(jobs)
			.set({ status: job.status })
			.where(eq(jobs.id, job.id));
	}
	await db
		.insert(assignments)
		.values([
			{
				id: "51000000-0000-4000-8000-000000000001",
				jobId: jobRows[1].id,
				technicianId: technicianRows[0].id,
				startAt: new Date("2026-01-02T08:30:00Z"),
				endAt: new Date("2026-01-02T10:00:00Z"),
				status: "confirmed" as const,
				cost: {
					travel: 4,
					slaLateness: 0,
					overtime: 0,
					imbalance: 1,
					disruption: 0,
				},
			},
		])
		.onConflictDoNothing();

	await db
		.insert(assetEvents)
		.values({
			id: "52000000-0000-4000-8000-000000000001",
			assetId: assetRows[0].id,
			jobId: jobRows[0].id,
			outcome: "Repeated callback risk raised",
			timeToRepairMinutes: 120,
		})
		.onConflictDoNothing();
	await db
		.insert(durationStats)
		.values({
			id: "53000000-0000-4000-8000-000000000001",
			equipmentType: "passenger lift",
			buildingId: buildingRows[0].id,
			medianMinutes: 75,
			p90Minutes: 120,
			sampleCount: 12,
		})
		.onConflictDoNothing();
	await db
		.insert(events)
		.values({
			id: "54000000-0000-4000-8000-000000000001",
			type: "job.safety_flagged",
			subjectType: "job",
			subjectId: jobRows[0].id,
			payload: { safetyFlag: true },
			reasoning: "Deterministic emergency phrase detected in intake text.",
			autonomy: "auto",
			idempotencyKey:
				"seed:job.safety_flagged:50000000-0000-4000-8000-000000000001",
		})
		.onConflictDoNothing();
	await db
		.insert(approvals)
		.values({
			id: "55000000-0000-4000-8000-000000000001",
			type: "emergency_assignment",
			subjectType: "job",
			subjectId: jobRows[0].id,
			context: { emergency: true },
			reasoning: "Emergency assignments require human control.",
		})
		.onConflictDoNothing();
	await db
		.insert(planProposals)
		.values({
			id: "56000000-0000-4000-8000-000000000001",
			before: { assignments: [] },
			after: { assignments: [jobRows[1].id] },
			diff: { jobsMoved: 1 },
			reasons: ["Satisfies chiller skill and Gold SLA"],
			impact: { slaRisk: "lower", travelMinutes: 4 },
			proposedBy: manager.id,
		})
		.onConflictDoNothing();
	await db
		.insert(outbox)
		.values({
			id: "57000000-0000-4000-8000-000000000001",
			idempotencyKey: "seed:message:50000000-0000-4000-8000-000000000001",
			channel: "email",
			payload: { to: "northstar@example.test", template: "emergency_received" },
			status: "dry_run" as const,
		})
		.onConflictDoNothing();
	await db
		.insert(settings)
		.values({
			id: "58000000-0000-4000-8000-000000000001",
			autoPilot: false,
			confidenceThreshold: "0.800",
			dryRun: true,
		})
		.onConflictDoNothing();
	await db
		.insert(simulationRuns)
		.values({
			id: "59000000-0000-4000-8000-000000000001",
			seed: 42,
			policy: "seeded-foundation",
			slaHitRate: "0.0000",
			travelMinutes: 0,
			jobsMoved: 0,
			isSimulated: true,
		})
		.onConflictDoNothing();

	console.log("Seeded deterministic DispatchPilot domain data.");
}

if (process.argv[1]?.endsWith("/seed.ts")) {
	if (process.env.NODE_ENV === "production") {
		console.error("Refusing to seed a production database.");
		process.exitCode = 1;
	} else {
	seedStaffUsers()
		.then(seedDomainData)
		.catch(() => {
			console.error("Seed failed; credential values were not logged.");
			process.exitCode = 1;
		})
		.finally(() => pool.end());
	}
}
