import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { approvals, assetEvents, assets, buildings, jobs } from "@/db/schema";
import { appendEvent, withEventTransaction } from "@/events/event-store";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";

export class AssetService {
	async callback(assetId: string, jobId?: string) {
		return withEventTransaction(async (tx) => {
			const [asset] = await tx.select().from(assets).where(eq(assets.id, assetId)).limit(1);
			if (!asset) throw new AppError("Asset not found", 404, ErrorCode.NOT_FOUND);
			await tx.insert(assetEvents).values({ assetId, jobId, outcome: "callback" });
			const since = new Date(Date.now() - 60 * 86_400_000);
			const callbacks = await tx.select().from(assetEvents).where(and(eq(assetEvents.assetId, assetId), eq(assetEvents.outcome, "callback"), gte(assetEvents.createdAt, since)));
			if (callbacks.length >= 3) {
				await tx.update(assets).set({ healthScore: Math.min(asset.healthScore, 35) }).where(eq(assets.id, assetId));
				const [existing] = await tx.select().from(approvals).where(and(eq(approvals.type, "inspection_recommendation"), eq(approvals.subjectId, assetId), eq(approvals.status, "pending"))).limit(1);
				if (!existing) await tx.insert(approvals).values({ type: "inspection_recommendation", subjectType: "asset", subjectId: assetId, context: { callbackCount: callbacks.length, windowDays: 60 }, reasoning: "Three or more callbacks occurred within 60 days.", status: "pending" });
				await appendEvent({ type: "asset.risk_raised", subjectType: "asset", subjectId: assetId, payload: { callbackCount: callbacks.length, windowDays: 60 }, reasoning: "Repeat-failure rule raised asset risk.", autonomy: "auto", idempotencyKey: `asset-risk:${assetId}:${since.toISOString().slice(0, 10)}` }, tx);
			}
			return { assetId, callbackCount: callbacks.length, riskRaised: callbacks.length >= 3 };
		});
	}

	async inspection(assetId: string) {
		const [row] = await db.select({ asset: assets, building: buildings }).from(assets).innerJoin(buildings, eq(assets.buildingId, buildings.id)).where(eq(assets.id, assetId)).limit(1);
		if (!row) throw new AppError("Asset not found", 404, ErrorCode.NOT_FOUND);
		return withEventTransaction(async (tx) => {
			const [job] = await tx.insert(jobs).values({ buildingId: row.building.id, assetId, requester: "DispatchPilot inspection", address: row.building.address, latitude: row.building.latitude, longitude: row.building.longitude, equipment: row.asset.type, skillRequired: "elevator", urgency: "high", safetyFlag: false, status: "received", confidence: "1.000", originalMessage: `Recommended inspection for ${row.asset.type}`, notes: "Created from repeat-failure approval." }).returning();
			if (!job) throw new AppError("Inspection job creation failed", 500, ErrorCode.INTERNAL_SERVER_ERROR);
			await appendEvent({ type: "inspection.recommended", subjectType: "asset", subjectId: assetId, payload: { jobId: job.id }, reasoning: "Manager created the recommended inspection job.", autonomy: "approved" }, tx);
			return job;
		});
	}
}
export const assetService = new AssetService();
