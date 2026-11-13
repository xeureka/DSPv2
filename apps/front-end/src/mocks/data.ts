import {
	approvalSchema,
	assignmentSchema,
	contractSchema,
	eventSchema,
	jobSchema,
	simulationRunSchema,
	technicianSchema,
	type Approval,
	type Assignment,
	type Contract,
	type Event,
	type Job,
	type SimulationRun,
	type Technician,
} from "@dspv2/shared";

export const mockNow = "2026-11-13T10:30:00+03:00";

export const technicians: Technician[] = [
	["tech-hana", "Hana", "late"],
	["tech-dawit", "Dawit", "busy"],
	["tech-sara", "Sara", "busy"],
	["tech-yonas", "Yonas", "available"],
	["tech-meron", "Meron", "available"],
	["tech-bekele", "Bekele", "busy"],
	["tech-almaz", "Almaz", "available"],
	["tech-fikru", "Fikru", "available"],
].map(([id, name, status], index) =>
	technicianSchema.parse({
		id,
		name,
		role: "technician",
		status,
		shiftStart: "08:00",
		shiftEnd: "17:00",
		skills: [
			{
				name: ["elevator", "refrigeration", "chiller", "split unit"][index % 4],
				level: 5,
			},
			{
				name: ["split unit", "chiller", "refrigeration", "elevator"][index % 4],
				level: 3,
			},
		],
	}),
);

export const contracts: Contract[] = [
	{
		id: "contract-tower-b",
		customer: "Tower B",
		tier: "Gold",
		responseMinutes: 240,
		status: "Active",
	},
	{
		id: "contract-mall-c",
		customer: "Mall C",
		tier: "Silver",
		responseMinutes: 480,
		status: "Active",
	},
	{
		id: "contract-hotel-d",
		customer: "Hotel D",
		tier: "Gold",
		responseMinutes: 240,
		status: "Needs review",
		flaggedClause: "Callback credit wording is unclear.",
	},
	{
		id: "contract-plaza-e",
		customer: "Plaza E",
		tier: "Bronze",
		responseMinutes: 1440,
		status: "Pending approval",
	},
	{
		id: "contract-office-f",
		customer: "Office F",
		tier: "Silver",
		responseMinutes: 480,
		status: "Active",
	},
].map((contract) => contractSchema.parse(contract));

const jobSeed = [
	[
		"JOB-001",
		"Lift out of service",
		"Tower B",
		"elevator",
		"attention",
		"emergency",
		true,
		"tech-hana",
	],
	[
		"JOB-002",
		"Split unit noise",
		"Mall C",
		"split unit",
		"scheduled",
		"high",
		false,
		"tech-dawit",
	],
	[
		"JOB-003",
		"Chiller service",
		"Hotel D",
		"chiller",
		"scheduled",
		"normal",
		false,
		"tech-sara",
	],
	[
		"JOB-004",
		"Cold room alarm",
		"Tower B",
		"refrigeration",
		"late",
		"high",
		false,
		"tech-hana",
	],
	...Array.from({ length: 20 }, (_, index) => [
		`JOB-${String(index + 5).padStart(3, "0")}`,
		[
			"Preventive inspection",
			"Temperature alert",
			"Door sensor check",
			"Compressor noise",
		][index % 4],
		["Mall C", "Hotel D", "Plaza E", "Office F"][index % 4],
		["elevator", "refrigeration", "chiller", "split unit"][index % 4],
		index < 12 ? "open" : index === 12 ? "attention" : "scheduled",
		index % 7 === 0 ? "high" : "normal",
		false,
		technicians[(index + 3) % technicians.length].id,
	]),
] as const;

export const jobs: Job[] = jobSeed.map(
	(
		[id, title, customer, skill, status, urgency, safety, assignedTechnicianId],
		index,
	) =>
		jobSchema.parse({
			id,
			title,
			customer,
			address: `${customer} · Addis Ababa`,
			skill,
			status,
			urgency,
			safety,
			contractId: contracts[index % contracts.length].id,
			confidence: id === "JOB-001" ? 0.94 : 0.88 + (index % 4) / 100,
			assignedTechnicianId,
			slaDueAt: `2026-11-13T${String(12 + (index % 5)).padStart(2, "0")}:00:00+03:00`,
			originalMessage: `Illustrative request ${id}: ${String(title).toLowerCase()} reported at ${customer}.`,
			notes:
				id === "JOB-001"
					? "Elevator level 3, 11 min away, SLA safe with 90th pct estimate."
					: "Coordinate access with the building desk.",
		}),
);

export const assignments: Assignment[] = jobs
	.filter((job) => job.assignedTechnicianId)
	.map((job, index) =>
		assignmentSchema.parse({
			jobId: job.id,
			technicianId: job.assignedTechnicianId,
			start: `${String(8 + (index % 8)).padStart(2, "0")}:00`,
			end: `${String(9 + (index % 8)).padStart(2, "0")}:00`,
			cost: {
				travel: 11 + index,
				slaLateness: job.status === "late" ? 18 : 0,
				overtime: 0,
				imbalance: index % 3,
				disruption: 0,
			},
		}),
	);

export const approvals: Approval[] = [
	[
		"approval-1",
		"emergency assignment",
		"Lift out of service - Tower B",
		"Safety flag requires human confirmation.",
	],
	[
		"approval-2",
		"low-confidence extraction",
		"Cold room alarm",
		"Extraction confidence is below the approval threshold.",
	],
	[
		"approval-3",
		"contract rules",
		"Plaza E contract",
		"Response target needs manager approval.",
	],
	[
		"approval-4",
		"inspection recommendation",
		"Lift B-2 root-cause inspection",
		"Four door-sensor callbacks in 60 days.",
	],
	[
		"approval-5",
		"re-plan",
		"Hana is late 25 min",
		"Move one job to protect the SLA.",
	],
].map(([id, type, title, reasoning]) =>
	approvalSchema.parse({ id, type, title, reasoning, status: "pending" }),
);

export const events: Event[] = Array.from({ length: 60 }, (_, index) =>
	eventSchema.parse({
		id: `event-${index + 1}`,
		type:
			index % 3 === 0
				? "assignment proposed"
				: index % 3 === 1
					? "SLA timer started"
					: "status updated",
		reasoning: "Deterministic demo event for the operations timeline.",
		autonomy: index % 4 === 0 ? "approved" : "auto",
		timestamp: `2026-11-13T${String(8 + Math.floor(index / 12)).padStart(2, "0")}:${String((index * 5) % 60).padStart(2, "0")}:00+03:00`,
		jobId: jobs[index % jobs.length].id,
	}),
);

export const simulationRuns: SimulationRun[] = [
	{
		scenario: "normal",
		days: 100,
		baselineSla: 91,
		plannerSla: 96,
		baselineTravel: 8420,
		plannerTravel: 7560,
		jobsMoved: 31,
	},
	{
		scenario: "heat wave",
		days: 100,
		baselineSla: 84,
		plannerSla: 91,
		baselineTravel: 9030,
		plannerTravel: 8210,
		jobsMoved: 44,
	},
	{
		scenario: "sick leave",
		days: 100,
		baselineSla: 78,
		plannerSla: 87,
		baselineTravel: 9720,
		plannerTravel: 8650,
		jobsMoved: 52,
	},
].map((run) => simulationRunSchema.parse(run));

export const mockDb = {
	jobs,
	technicians,
	contracts,
	assignments,
	approvals,
	events,
	simulationRuns,
};
