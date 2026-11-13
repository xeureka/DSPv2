import { count } from "drizzle-orm";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { db } from "@/db";
import {
	assets,
	buildings,
	contracts,
	events,
	jobs,
	settings,
	technicians,
} from "@/db/schema";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";

const route = createRoute({
	method: "get",
	path: "/foundation",
	middleware: [sessionMiddleware, requireRole()],
	responses: {
		200: {
			description: "Seeded B0 foundation summary",
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(true),
						data: z.object({
							buildings: z.number(),
							technicians: z.number(),
							contracts: z.number(),
							assets: z.number(),
							jobs: z.number(),
							events: z.number(),
							settings: z.number(),
						}),
					}),
				},
			},
		},
	},
});

const foundation = new OpenAPIHono<AppEnv>();

foundation.openapi(route, async (c) => {
	const [
		[buildingCount],
		[technicianCount],
		[contractCount],
		[assetCount],
		[jobCount],
		[eventCount],
		[settingsCount],
	] = await Promise.all([
		db.select({ count: count() }).from(buildings),
		db.select({ count: count() }).from(technicians),
		db.select({ count: count() }).from(contracts),
		db.select({ count: count() }).from(assets),
		db.select({ count: count() }).from(jobs),
		db.select({ count: count() }).from(events),
		db.select({ count: count() }).from(settings),
	]);

	return successResponse(c, {
		buildings: buildingCount?.count ?? 0,
		technicians: technicianCount?.count ?? 0,
		contracts: contractCount?.count ?? 0,
		assets: assetCount?.count ?? 0,
		jobs: jobCount?.count ?? 0,
		events: eventCount?.count ?? 0,
		settings: settingsCount?.count ?? 0,
	});
});

export default foundation;
