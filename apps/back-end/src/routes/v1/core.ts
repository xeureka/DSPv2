import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { coreService } from "@/services/core.service";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";
import { planService } from "@/services/plan.service";

const anyResponse = z.object({ success: z.literal(true), data: z.any() });
const idParams = z.object({ id: z.string().uuid() });
const managerDispatcher = [
	sessionMiddleware,
	requireRole("manager", "dispatcher"),
];
const managerOnly = [sessionMiddleware, requireRole("manager")];

const jobInput = z.object({
	inboundMessageId: z.string().min(1).max(255).optional(),
	buildingId: z.string().uuid(),
	assetId: z.string().uuid().optional(),
	contractId: z.string().uuid().optional(),
	requester: z.string().min(1).max(255),
	address: z.string().min(1),
	latitude: z.number().finite(),
	longitude: z.number().finite(),
	equipment: z.string().min(1).max(100),
	skillRequired: z.enum(["elevator", "refrigeration", "chiller", "split unit"]),
	urgency: z.enum(["normal", "high", "emergency"]).default("normal"),
	safetyFlag: z.boolean().default(false),
	confidence: z.number().min(0).max(1).default(1),
	originalMessage: z.string().min(1),
	notes: z.string().optional(),
	slaDueAt: z.string().datetime().optional(),
});

const core = new OpenAPIHono<AppEnv>();

core.openapi(
	createRoute({
		method: "get",
		path: "/board",
		middleware: managerDispatcher,
		responses: {
			200: {
				description: "Computed dispatch KPIs",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => successResponse(c, await coreService.board()),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/jobs",
		middleware: managerDispatcher,
		request: {
			query: z.object({
				status: z.string().optional(),
				urgency: z.string().optional(),
				limit: z.coerce.number().int().min(1).max(100).default(20),
				cursor: z.string().datetime().optional(),
			}),
		},
		responses: {
			200: {
				description: "Cursor-paginated jobs",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.listJobs(c.req.valid("query"))),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/jobs/{id}",
		middleware: managerDispatcher,
		request: { params: idParams },
		responses: {
			200: {
				description: "Job detail",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.getJob(c.req.valid("param").id)),
);

core.openapi(
	createRoute({
		method: "post",
		path: "/jobs",
		middleware: managerDispatcher,
		request: {
			body: { content: { "application/json": { schema: jobInput } } },
		},
		responses: {
			200: {
				description: "Created or existing idempotent job",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.createJob(c.req.valid("json"))),
);

for (const action of ["approve", "reassign"] as const) {
	core.openapi(
		createRoute({
			method: "post",
			path: "/jobs/{id}/" + action,
			middleware: managerDispatcher,
			request: { params: idParams },
			responses: {
				200: {
					description: "Idempotent job action",
					content: { "application/json": { schema: anyResponse } },
				},
			},
		}),
		async (c) => {
			const id = c.req.valid("param").id;
			return successResponse(
				c,
				action === "approve"
					? await coreService.approveJob(id)
					: await coreService.reassignJob(id),
			);
		},
	);
}

core.openapi(
	createRoute({
		method: "get",
		path: "/jobs/{id}/events",
		middleware: managerDispatcher,
		request: { params: idParams },
		responses: {
			200: {
				description: "Job event history",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.getJobEvents(c.req.valid("param").id)),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/technicians",
		middleware: managerDispatcher,
		responses: {
			200: {
				description: "Technician roster",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => successResponse(c, await coreService.listTechnicians()),
);

core.openapi(
	createRoute({
		method: "patch",
		path: "/technicians/{id}",
		middleware: managerOnly,
		request: {
			params: idParams,
			body: {
				content: {
					"application/json": {
						schema: z.object({
							shiftStart: z
								.string()
								.regex(/^\d{2}:\d{2}$/)
								.optional(),
							shiftEnd: z
								.string()
								.regex(/^\d{2}:\d{2}$/)
								.optional(),
							status: z.enum(["available", "busy", "late"]).optional(),
						}),
					},
				},
			},
		},
		responses: {
			200: {
				description: "Updated technician",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(
			c,
			await coreService.patchTechnician(
				c.req.valid("param").id,
				c.req.valid("json"),
			),
		),
);

core.openapi(
	createRoute({
		method: "post",
		path: "/technicians/{id}/status",
		middleware: [sessionMiddleware],
		request: {
			params: idParams,
			body: {
				content: {
					"application/json": {
						schema: z.object({
							status: z.enum(["on_my_way", "running_late", "done"]),
							minutes: z.number().int().positive().optional(),
						}),
					},
				},
			},
		},
		responses: {
			200: {
				description: "Technician status update",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => {
		const user = c.get("user");
		if (!user)
			throw new AppError(
				"Authentication required",
				401,
				ErrorCode.UNAUTHORIZED,
			);
		if (user.role !== "dispatcher" && user.role !== "technician")
			throw new AppError("Insufficient role", 403, ErrorCode.FORBIDDEN);
		const technician = await coreService.listTechnicians();
		const own = technician.find((row) => row.user.id === user.id);
		const id = c.req.valid("param").id;
		if (user.role === "technician" && own?.technician.id !== id)
			throw new AppError("Insufficient role", 403, ErrorCode.FORBIDDEN);
		const result = await coreService.statusTechnician(
			c.req.valid("param").id,
			c.req.valid("json").status,
			c.req.valid("json").minutes,
		);
		const proposal = c.req.valid("json").status === "running_late"
			? await planService.createDelayProposal(c.req.valid("param").id, c.req.valid("json").minutes ?? 0, user.id)
			: null;
		return successResponse(c, { ...result, proposal });
	},
);

core.openapi(
	createRoute({
		method: "get",
		path: "/me/jobs",
		middleware: [sessionMiddleware, requireRole("technician")],
		responses: {
			200: {
				description: "Current technician jobs",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => {
		const user = c.get("user");
		if (!user)
			throw new AppError(
				"Authentication required",
				401,
				ErrorCode.UNAUTHORIZED,
			);
		return successResponse(c, await coreService.meJobs(user.id));
	},
);

core.openapi(
	createRoute({
		method: "get",
		path: "/approvals",
		middleware: managerDispatcher,
		request: {
			query: z.object({
				status: z.enum(["pending", "approved", "rejected"]).optional(),
			}),
		},
		responses: {
			200: {
				description: "Approval queue",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(
			c,
			await coreService.listApprovals(c.req.valid("query").status),
		),
);

for (const decision of ["approve", "reject"] as const) {
	core.openapi(
		createRoute({
			method: "post",
			path: "/approvals/{id}/" + decision,
			middleware: managerDispatcher,
			request: { params: idParams },
			responses: {
				200: {
					description: "Idempotent approval decision",
					content: { "application/json": { schema: anyResponse } },
				},
			},
		}),
		async (c) => {
			const user = c.get("user");
			if (!user)
				throw new AppError(
					"Authentication required",
					401,
					ErrorCode.UNAUTHORIZED,
				);
			return successResponse(
				c,
				await coreService.decideApproval(
					c.req.valid("param").id,
					decision === "approve" ? "approved" : "rejected",
					user.id,
				),
			);
		},
	);
}

core.openapi(
	createRoute({
		method: "get",
		path: "/events",
		middleware: managerDispatcher,
		request: {
			query: z.object({
				type: z.string().optional(),
				subjectType: z.string().optional(),
				limit: z.coerce.number().int().min(1).max(100).default(50),
				cursor: z.string().datetime().optional(),
			}),
		},
		responses: {
			200: {
				description: "Cursor-paginated event log",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.listEvents(c.req.valid("query"))),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/events/replay",
		middleware: managerDispatcher,
		request: { query: z.object({ at: z.string().datetime() }) },
		responses: {
			200: {
				description: "Events replayed through timestamp",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.replayEvents(c.req.valid("query").at)),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/assets",
		middleware: managerDispatcher,
		responses: {
			200: {
				description: "Asset list",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => successResponse(c, await coreService.listAssets()),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/assets/{id}",
		middleware: managerDispatcher,
		request: { params: idParams },
		responses: {
			200: {
				description: "Asset detail",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.getAsset(c.req.valid("param").id)),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/contracts",
		middleware: managerDispatcher,
		responses: {
			200: {
				description: "Contract list",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => successResponse(c, await coreService.listContracts()),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/contracts/{id}",
		middleware: managerDispatcher,
		request: { params: idParams },
		responses: {
			200: {
				description: "Contract detail",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) =>
		successResponse(c, await coreService.getContract(c.req.valid("param").id)),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/sla/compliance",
		middleware: managerDispatcher,
		responses: {
			200: {
				description: "Computed SLA compliance",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => successResponse(c, await coreService.compliance()),
);

core.openapi(
	createRoute({
		method: "get",
		path: "/settings",
		middleware: managerOnly,
		responses: {
			200: {
				description: "Autonomy settings",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => successResponse(c, await coreService.settings()),
);

core.openapi(
	createRoute({
		method: "patch",
		path: "/settings/autonomy",
		middleware: managerOnly,
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							autoPilot: z.boolean().optional(),
							confidenceThreshold: z.number().min(0).max(1).optional(),
							dryRun: z.boolean().optional(),
						}),
					},
				},
			},
		},
		responses: {
			200: {
				description: "Updated autonomy settings",
				content: { "application/json": { schema: anyResponse } },
			},
		},
	}),
	async (c) => {
		const user = c.get("user");
		if (!user)
			throw new AppError(
				"Authentication required",
				401,
				ErrorCode.UNAUTHORIZED,
			);
		return successResponse(
			c,
			await coreService.updateSettings(c.req.valid("json"), user.id),
		);
	},
);

export default core;
