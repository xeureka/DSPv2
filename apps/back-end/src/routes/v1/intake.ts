import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { commandIntentSchema } from "@dspv2/shared";
import { z } from "zod";
import { intakeService } from "@/services/intake.service";
import { coreService } from "@/services/core.service";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";

const intake = new OpenAPIHono<AppEnv>();
const staff = [sessionMiddleware, requireRole("manager", "dispatcher")];
const response = z.object({ success: z.literal(true), data: z.any() });
const messageInput = z.object({ messageId: z.string().min(1).max(255), text: z.string().min(1).max(20_000), requester: z.string().min(1).max(255).optional(), buildingId: z.string().uuid().optional(), receivedAt: z.string().datetime().optional() });

intake.openapi(createRoute({ method: "post", path: "/intake/messages", middleware: staff, request: { body: { content: { "application/json": { schema: messageInput } } } }, responses: { 200: { description: "Validated intake result", content: { "application/json": { schema: response } } } } }), async (c) => successResponse(c, await intakeService.createMessage(c.req.valid("json"))));

const commandInput = z.object({ text: z.string().min(1).max(2_000) });
intake.openapi(createRoute({ method: "post", path: "/intake/command", middleware: staff, request: { body: { content: { "application/json": { schema: commandInput } } } }, responses: { 200: { description: "Parsed command and result", content: { "application/json": { schema: response } } } } }), async (c) => {
	const text = c.req.valid("json").text;
	const delay = text.match(/(?:delay|late).*?([0-9]+)\s*(?:min|minute)/i);
	const technician = text.match(/technician\s+([0-9a-f-]{36})/i)?.[1];
	const job = text.match(/job\s+([0-9a-f-]{36})/i)?.[1];
	let intent;
	if (delay && technician) intent = { intent: "delay_technician" as const, technicianId: technician, minutes: Number(delay[1]) };
	else if (/show\s+job/i.test(text) && job) intent = { intent: "show_job" as const, jobId: job };
	else throw new Error("Command did not match a supported intent");
	const parsed = commandIntentSchema.parse(intent);
	const result = parsed.intent === "delay_technician" ? await coreService.statusTechnician(parsed.technicianId, "running_late", parsed.minutes) : parsed.intent === "show_job" ? await coreService.getJob(parsed.jobId) : null;
	return successResponse(c, { intent: parsed, result });
});

export default intake;
