import crypto from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { escalationLevel } from "@dspv2/engine";
import { db } from "@/db";
import { contracts, jobs, outbox, slaRules } from "@/db/schema";
import { appendEvent } from "@/events/event-store";
import { env } from "@/lib/env";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";
import { z } from "zod";

const internal = new OpenAPIHono<AppEnv>();
const response = z.object({ success: z.literal(true), data: z.any() });
function secretMatches(value: string | undefined) { if (!value || !env.SCHEDULER_SECRET) return false; const a = Buffer.from(value); const b = Buffer.from(env.SCHEDULER_SECRET); return a.length === b.length && crypto.timingSafeEqual(a, b); }

internal.openapi(createRoute({ method: "post", path: "/internal/tick", request: {}, responses: { 200: { description: "Run scheduler tick", content: { "application/json": { schema: response } } }, 401: { description: "Invalid scheduler secret" } } }), async (c) => {
	if (!secretMatches(c.req.header("x-scheduler-secret"))) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid scheduler secret" } }, 401);
	const now = new Date();
	const rows = await db.select({ job: jobs, rule: slaRules }).from(jobs).leftJoin(contracts, eq(jobs.contractId, contracts.id)).leftJoin(slaRules, eq(slaRules.contractId, contracts.id)).where(and(inArray(jobs.status, ["received", "triaged", "proposed", "assigned", "late"]), eq(jobs.safetyFlag, true)));
	let escalated = 0;
	for (const row of rows) { if (!row.rule) continue; const level = escalationLevel(row.job.receivedAt, now, { tier: "gold", responseMinutes: row.rule.responseMinutes, resolutionTarget: row.rule.resolutionMinutes }, row.job.safetyFlag); for (let n = 1; n <= level; n++) { const event = await appendEvent({ type: "sla.escalated", subjectType: "job", subjectId: row.job.id, payload: { level: n, safetyCritical: row.job.safetyFlag }, reasoning: `SLA escalation threshold ${n} crossed.`, autonomy: "auto", idempotencyKey: `sla:${row.job.id}:${n}` }); if (event.createdAt.getTime() >= now.getTime() - 2_000) escalated++; } }
	const queued = await db.select().from(outbox).where(eq(outbox.status, "queued"));
	for (const item of queued) { await db.update(outbox).set({ status: env.DRY_RUN ? "dry_run" : "sent", sentAt: now, attempts: item.attempts + 1 }).where(eq(outbox.id, item.id)); await appendEvent({ type: "message.sent", subjectType: "outbox", subjectId: item.id, payload: { dryRun: env.DRY_RUN }, reasoning: env.DRY_RUN ? "Outbound message logged in dry-run mode." : "Outbound message sent by the notifier worker.", autonomy: "auto", idempotencyKey: `outbox:${item.id}:sent` }); }
	return successResponse(c, { escalated, outboxFlushed: queued.length, ranAt: now.toISOString() });
});
export default internal;
