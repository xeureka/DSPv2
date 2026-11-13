import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	real,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { userRoleValues } from "@dspv2/shared";

export const userRole = pgEnum("user_role", userRoleValues);
export const technicianStatus = pgEnum("technician_status", [
	"available",
	"busy",
	"late",
]);
export const skillName = pgEnum("skill_name", [
	"elevator",
	"refrigeration",
	"chiller",
	"split unit",
]);
export const contractStatus = pgEnum("contract_status", [
	"active",
	"pending_approval",
	"needs_review",
]);
export const contractTier = pgEnum("contract_tier", [
	"gold",
	"silver",
	"bronze",
]);
export const jobStatus = pgEnum("job_status", [
	"received",
	"triaged",
	"proposed",
	"assigned",
	"en_route",
	"on_site",
	"open",
	"scheduled",
	"attention",
	"late",
	"done",
	"cancelled",
]);
export const jobUrgency = pgEnum("job_urgency", [
	"normal",
	"high",
	"emergency",
]);
export const assignmentStatus = pgEnum("assignment_status", [
	"proposed",
	"confirmed",
	"started",
	"completed",
	"cancelled",
]);
export const eventAutonomy = pgEnum("event_autonomy", ["auto", "approved"]);
export const approvalStatus = pgEnum("approval_status", [
	"pending",
	"approved",
	"rejected",
]);
export const approvalType = pgEnum("approval_type", [
	"emergency_assignment",
	"low_confidence_extraction",
	"contract_rules",
	"inspection_recommendation",
	"replan",
]);
export const proposalStatus = pgEnum("proposal_status", [
	"pending",
	"approved",
	"rejected",
]);
export const outboxStatus = pgEnum("outbox_status", [
	"queued",
	"dry_run",
	"sent",
	"failed",
]);

const auditColumns = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: userRole("role").notNull().default("technician"),
	...auditColumns,
});

export const accounts = pgTable(
	"accounts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accountId: varchar("account_id", { length: 255 }).notNull(),
		providerId: varchar("provider_id", { length: 100 }).notNull(),
		issuer: varchar("issuer", { length: 255 }).notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
		}),
		scope: text("scope"),
		password: text("password"),
		...auditColumns,
	},
	(table) => [
		index("accounts_user_id_idx").on(table.userId),
		unique("accounts_provider_account_unique").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: varchar("token", { length: 255 }).notNull().unique(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		ipAddress: varchar("ip_address", { length: 100 }),
		userAgent: text("user_agent"),
		...auditColumns,
	},
	(table) => [
		index("sessions_user_id_idx").on(table.userId),
		index("sessions_expires_at_idx").on(table.expiresAt),
	],
);

export const verifications = pgTable(
	"verifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		identifier: varchar("identifier", { length: 255 }).notNull(),
		value: varchar("value", { length: 255 }).notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		...auditColumns,
	},
	(table) => [
		index("verifications_identifier_idx").on(table.identifier),
		index("verifications_expires_at_idx").on(table.expiresAt),
	],
);

export const buildings = pgTable(
	"buildings",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		customer: varchar("customer", { length: 255 }).notNull(),
		address: text("address").notNull(),
		latitude: real("latitude").notNull(),
		longitude: real("longitude").notNull(),
		...auditColumns,
	},
	(table) => [index("buildings_customer_idx").on(table.customer)],
);

export const technicians = pgTable(
	"technicians",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		shiftStart: varchar("shift_start", { length: 5 }).notNull(),
		shiftEnd: varchar("shift_end", { length: 5 }).notNull(),
		latitude: real("latitude").notNull().default(9),
		longitude: real("longitude").notNull().default(38.75),
		status: technicianStatus("status").notNull().default("available"),
		...auditColumns,
	},
	(table) => [
		unique("technicians_user_id_unique").on(table.userId),
		index("technicians_status_idx").on(table.status),
	],
);

export const skills = pgTable(
	"skills",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		technicianId: uuid("technician_id")
			.notNull()
			.references(() => technicians.id, { onDelete: "cascade" }),
		name: skillName("name").notNull(),
		level: integer("level").notNull(),
		...auditColumns,
	},
	(table) => [
		unique("skills_technician_name_unique").on(table.technicianId, table.name),
	],
);

export const contracts = pgTable(
	"contracts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		buildingId: uuid("building_id")
			.notNull()
			.references(() => buildings.id, { onDelete: "restrict" }),
		customer: varchar("customer", { length: 255 }).notNull(),
		sourcePdf: text("source_pdf"),
		status: contractStatus("status").notNull().default("pending_approval"),
		tier: contractTier("tier").notNull(),
		...auditColumns,
	},
	(table) => [
		index("contracts_building_idx").on(table.buildingId),
		index("contracts_status_idx").on(table.status),
	],
);

export const slaRules = pgTable(
	"sla_rules",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		contractId: uuid("contract_id")
			.notNull()
			.references(() => contracts.id, { onDelete: "cascade" }),
		responseMinutes: integer("response_minutes").notNull(),
		resolutionMinutes: integer("resolution_minutes").notNull(),
		callbackCap: integer("callback_cap"),
		creditTerms: text("credit_terms"),
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		approvedBy: uuid("approved_by").references(() => users.id, {
			onDelete: "set null",
		}),
		...auditColumns,
	},
	(table) => [index("sla_rules_contract_idx").on(table.contractId)],
);

export const assets = pgTable(
	"assets",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		buildingId: uuid("building_id")
			.notNull()
			.references(() => buildings.id, { onDelete: "restrict" }),
		type: varchar("type", { length: 100 }).notNull(),
		installDate: date("install_date"),
		healthScore: integer("health_score").notNull().default(100),
		...auditColumns,
	},
	(table) => [index("assets_building_idx").on(table.buildingId)],
);

export const jobs = pgTable(
	"jobs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		inboundMessageId: varchar("inbound_message_id", { length: 255 }),
		buildingId: uuid("building_id")
			.notNull()
			.references(() => buildings.id, { onDelete: "restrict" }),
		assetId: uuid("asset_id").references(() => assets.id, {
			onDelete: "set null",
		}),
		contractId: uuid("contract_id").references(() => contracts.id, {
			onDelete: "set null",
		}),
		requester: varchar("requester", { length: 255 }).notNull(),
		address: text("address").notNull(),
		latitude: real("latitude").notNull(),
		longitude: real("longitude").notNull(),
		equipment: varchar("equipment", { length: 100 }).notNull(),
		skillRequired: skillName("skill_required").notNull(),
		urgency: jobUrgency("urgency").notNull().default("normal"),
		safetyFlag: boolean("safety_flag").notNull().default(false),
		status: jobStatus("status").notNull().default("open"),
		confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
		originalMessage: text("original_message").notNull(),
		notes: text("notes"),
		receivedAt: timestamp("received_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
		...auditColumns,
	},
	(table) => [
		unique("jobs_inbound_message_id_unique").on(table.inboundMessageId),
		index("jobs_status_idx").on(table.status),
		index("jobs_sla_due_idx").on(table.slaDueAt),
		index("jobs_building_idx").on(table.buildingId),
		index("jobs_contract_idx").on(table.contractId),
	],
);

export const assignments = pgTable(
	"assignments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		technicianId: uuid("technician_id")
			.notNull()
			.references(() => technicians.id, { onDelete: "restrict" }),
		startAt: timestamp("start_at", { withTimezone: true }).notNull(),
		endAt: timestamp("end_at", { withTimezone: true }).notNull(),
		status: assignmentStatus("status").notNull().default("proposed"),
		cost: jsonb("cost").$type<Record<string, number>>(),
		...auditColumns,
	},
	(table) => [
		index("assignments_job_idx").on(table.jobId),
		index("assignments_technician_start_idx").on(
			table.technicianId,
			table.startAt,
		),
	],
);

export const assetEvents = pgTable(
	"asset_events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		assetId: uuid("asset_id")
			.notNull()
			.references(() => assets.id, { onDelete: "cascade" }),
		jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
		outcome: text("outcome").notNull(),
		timeToRepairMinutes: integer("time_to_repair_minutes"),
		...auditColumns,
	},
	(table) => [
		index("asset_events_asset_idx").on(table.assetId),
		index("asset_events_job_idx").on(table.jobId),
	],
);

export const durationStats = pgTable(
	"duration_stats",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		equipmentType: varchar("equipment_type", { length: 100 }).notNull(),
		technicianId: uuid("technician_id").references(() => technicians.id, {
			onDelete: "set null",
		}),
		buildingId: uuid("building_id").references(() => buildings.id, {
			onDelete: "set null",
		}),
		medianMinutes: integer("median_minutes").notNull(),
		p90Minutes: integer("p90_minutes").notNull(),
		sampleCount: integer("sample_count").notNull().default(0),
		...auditColumns,
	},
	(table) => [
		index("duration_stats_equipment_idx").on(table.equipmentType),
		unique("duration_stats_scope_unique").on(
			table.equipmentType,
			table.technicianId,
			table.buildingId,
		),
	],
);

export const events = pgTable(
	"events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		type: varchar("type", { length: 100 }).notNull(),
		subjectType: varchar("subject_type", { length: 100 }).notNull(),
		subjectId: uuid("subject_id"),
		payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
		reasoning: text("reasoning").notNull(),
		autonomy: eventAutonomy("autonomy").notNull(),
		idempotencyKey: varchar("idempotency_key", { length: 255 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("events_subject_time_idx").on(
			table.subjectType,
			table.subjectId,
			table.createdAt,
		),
		index("events_created_at_idx").on(table.createdAt),
		unique("events_idempotency_key_unique").on(table.idempotencyKey),
	],
);

export const planProposals = pgTable(
	"plan_proposals",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		status: proposalStatus("status").notNull().default("pending"),
		before: jsonb("before").$type<Record<string, unknown>>().notNull(),
		after: jsonb("after").$type<Record<string, unknown>>().notNull(),
		diff: jsonb("diff").$type<Record<string, unknown>>().notNull(),
		reasons: jsonb("reasons").$type<string[]>().notNull(),
		impact: jsonb("impact").$type<Record<string, unknown>>().notNull(),
		proposedBy: uuid("proposed_by").references(() => users.id, {
			onDelete: "set null",
		}),
		decidedBy: uuid("decided_by").references(() => users.id, {
			onDelete: "set null",
		}),
		decidedAt: timestamp("decided_at", { withTimezone: true }),
		...auditColumns,
	},
	(table) => [index("plan_proposals_status_idx").on(table.status)],
);

export const approvals = pgTable(
	"approvals",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		type: approvalType("type").notNull(),
		subjectType: varchar("subject_type", { length: 100 }).notNull(),
		subjectId: uuid("subject_id"),
		context: jsonb("context").$type<Record<string, unknown>>().notNull(),
		reasoning: text("reasoning").notNull(),
		status: approvalStatus("status").notNull().default("pending"),
		decidedBy: uuid("decided_by").references(() => users.id, {
			onDelete: "set null",
		}),
		decidedAt: timestamp("decided_at", { withTimezone: true }),
		...auditColumns,
	},
	(table) => [
		index("approvals_status_idx").on(table.status),
		index("approvals_subject_idx").on(table.subjectType, table.subjectId),
	],
);

export const outbox = pgTable(
	"outbox",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
		channel: varchar("channel", { length: 50 }).notNull(),
		payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
		status: outboxStatus("status").notNull().default("queued"),
		attempts: integer("attempts").notNull().default(0),
		lastError: text("last_error"),
		sentAt: timestamp("sent_at", { withTimezone: true }),
		...auditColumns,
	},
	(table) => [
		unique("outbox_idempotency_key_unique").on(table.idempotencyKey),
		index("outbox_status_idx").on(table.status),
	],
);

export const settings = pgTable("settings", {
	id: uuid("id").defaultRandom().primaryKey(),
	autoPilot: boolean("auto_pilot").notNull().default(false),
	confidenceThreshold: numeric("confidence_threshold", {
		precision: 4,
		scale: 3,
	})
		.notNull()
		.default("0.8"),
	dryRun: boolean("dry_run").notNull().default(true),
	updatedBy: uuid("updated_by").references(() => users.id, {
		onDelete: "set null",
	}),
	...auditColumns,
});

export const simulationRuns = pgTable(
	"simulation_runs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		seed: integer("seed").notNull(),
		policy: varchar("policy", { length: 100 }).notNull(),
		slaHitRate: numeric("sla_hit_rate", { precision: 5, scale: 4 }).notNull(),
		travelMinutes: integer("travel_minutes").notNull(),
		jobsMoved: integer("jobs_moved").notNull(),
		isSimulated: boolean("is_simulated").notNull().default(true),
		...auditColumns,
	},
	(table) => [index("simulation_runs_created_at_idx").on(table.createdAt)],
);
