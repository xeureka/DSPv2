import { z } from "zod";

export const userRoleValues = ["manager", "dispatcher", "technician"] as const;

export const userRoleSchema = z.enum(userRoleValues);
export type UserRole = z.infer<typeof userRoleSchema>;

export const apiErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorSchema>;

export const staffSkillSchema = z.object({
	name: z.enum(["elevator", "refrigeration", "chiller", "split unit"]),
	level: z.number().int().min(1).max(5),
});
export type StaffSkill = z.infer<typeof staffSkillSchema>;

export const technicianSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: z.literal("technician"),
	skills: z.array(staffSkillSchema),
	shiftStart: z.string(),
	shiftEnd: z.string(),
	status: z.enum(["available", "busy", "late"]),
});
export type Technician = z.infer<typeof technicianSchema>;

export const contractSchema = z.object({
	id: z.string(),
	customer: z.string(),
	tier: z.enum(["Gold", "Silver", "Bronze"]),
	responseMinutes: z.number().int().positive(),
	status: z.enum(["Active", "Pending approval", "Needs review"]),
	flaggedClause: z.string().optional(),
});
export type Contract = z.infer<typeof contractSchema>;

export const jobSchema = z.object({
	id: z.string(),
	title: z.string(),
	customer: z.string(),
	address: z.string(),
	skill: staffSkillSchema.shape.name,
	status: z.enum(["open", "scheduled", "attention", "late", "done"]),
	urgency: z.enum(["normal", "high", "emergency"]),
	safety: z.boolean(),
	contractId: z.string(),
	confidence: z.number().min(0).max(1),
	assignedTechnicianId: z.string().optional(),
	slaDueAt: z.string(),
	originalMessage: z.string(),
	notes: z.string(),
});
export type Job = z.infer<typeof jobSchema>;

export const assignmentSchema = z.object({
	jobId: z.string(),
	technicianId: z.string(),
	start: z.string(),
	end: z.string(),
	cost: z.object({
		travel: z.number(),
		slaLateness: z.number(),
		overtime: z.number(),
		imbalance: z.number(),
		disruption: z.number(),
	}),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const eventSchema = z.object({
	id: z.string(),
	type: z.string(),
	reasoning: z.string(),
	autonomy: z.enum(["auto", "approved"]),
	timestamp: z.string(),
	jobId: z.string().optional(),
});
export type Event = z.infer<typeof eventSchema>;

export const approvalSchema = z.object({
	id: z.string(),
	type: z.enum(["emergency assignment", "low-confidence extraction", "contract rules", "inspection recommendation", "re-plan"]),
	title: z.string(),
	reasoning: z.string(),
	status: z.enum(["pending", "approved", "rejected"]),
});
export type Approval = z.infer<typeof approvalSchema>;

export const simulationRunSchema = z.object({
	scenario: z.enum(["normal", "heat wave", "sick leave"]),
	days: z.literal(100),
	baselineSla: z.number(),
	plannerSla: z.number(),
	baselineTravel: z.number(),
	plannerTravel: z.number(),
	jobsMoved: z.number(),
});
export type SimulationRun = z.infer<typeof simulationRunSchema>;

export const eventTypeValues = [
	"job.received",
	"intake.safety_scanned",
	"intake.extracted",
	"intake.prompt_injection",
	"intake.fallback",
	"job.extracted",
	"job.triaged",
	"job.safety_flagged",
	"assignment.proposed",
	"assignment.confirmed",
	"assignment.reassigned",
	"technician.status_changed",
	"technician.late",
	"plan.proposed",
	"plan.approved",
	"plan.rejected",
	"sla.timer_started",
	"sla.escalated",
	"sla.breached",
	"contract.extracted",
	"contract.approved",
	"asset.risk_raised",
	"inspection.recommended",
	"message.queued",
	"message.sent",
	"settings.changed",
	"simulation.run",
] as const;

export const eventTypeSchema = z.enum(eventTypeValues);
export type EventType = z.infer<typeof eventTypeSchema>;

export const autonomySchema = z.enum(["auto", "approved"]);

export const equipmentValues = [
	"elevator",
	"refrigeration",
	"chiller",
	"split unit",
] as const;
export const equipmentSchema = z.enum(equipmentValues);
export const urgencySchema = z.enum(["normal", "high", "emergency"]);

export const evidenceSpanSchema = z.object({
	text: z.string().min(1).max(240),
	start: z.number().int().min(0),
	end: z.number().int().min(0),
});

export const jobDraftSchema = z.object({
	equipment: equipmentSchema,
	skill: z.enum(["elevator", "refrigeration", "chiller", "split unit"]),
	urgency: urgencySchema,
	locationText: z.string().max(500).default(""),
	requester: z.string().max(255).default("Unknown requester"),
	confidence: z.number().min(0).max(1),
	evidenceSpans: z.array(evidenceSpanSchema).max(20).default([]),
}).strict();
export type JobDraft = z.infer<typeof jobDraftSchema>;

export const intakeMessageSchema = z.object({
	messageId: z.string().min(1).max(255),
	text: z.string().min(1).max(20_000),
	requester: z.string().min(1).max(255).optional(),
	buildingId: z.string().uuid().optional(),
	receivedAt: z.string().datetime().optional(),
});
export type IntakeMessage = z.infer<typeof intakeMessageSchema>;

export const intakeResultSchema = z.object({
	job: z.unknown(),
	approval: z.unknown().nullable(),
	safetyFlag: z.boolean(),
	usedFallback: z.boolean(),
});

export const commandIntentSchema = z.discriminatedUnion("intent", [
	z.object({ intent: z.literal("delay_technician"), technicianId: z.string().uuid(), minutes: z.number().int().positive() }),
	z.object({ intent: z.literal("move_job"), jobId: z.string().uuid(), technicianId: z.string().uuid() }),
	z.object({ intent: z.literal("what_if_staffing"), skill: equipmentSchema, count: z.number().int().positive() }),
	z.object({ intent: z.literal("show_job"), jobId: z.string().uuid() }),
]);
export type CommandIntent = z.infer<typeof commandIntentSchema>;

export const ruleDraftSchema = z.object({
	tier: z.enum(["gold", "silver", "bronze"]),
	responseMinutes: z.number().int().positive(),
	resolutionMinutes: z.number().int().positive(),
	callbackCap: z.number().int().positive().nullable(),
	creditTerms: z.string().max(1_000).nullable(),
	unclear: z.boolean(),
	evidence: z.string().max(500),
}).strict();
export const contractRulesDraftSchema = z.object({ rules: z.array(ruleDraftSchema).min(1).max(10) }).strict();
export type RuleDraft = z.infer<typeof ruleDraftSchema>;
export type ContractRulesDraft = z.infer<typeof contractRulesDraftSchema>;
