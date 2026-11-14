import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { contractUploadService } from "@/services/contract-upload.service";
import { requireRole } from "@/middlewares/require-role.middleware";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { successResponse } from "@/utils/api-response";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCode } from "@/lib/errors/error-codes";

const upload = new OpenAPIHono<AppEnv>();
upload.post("/contracts/upload", sessionMiddleware, requireRole("manager", "dispatcher"), async (c) => {
	const body = await c.req.parseBody();
	const file = body.file;
	const buildingId = typeof body.buildingId === "string" ? body.buildingId : "";
	const tier = typeof body.tier === "string" ? body.tier : undefined;
	const parsed = z.object({ buildingId: z.string().uuid(), tier: z.enum(["gold", "silver", "bronze"]).optional() }).safeParse({ buildingId, tier });
	if (!parsed.success || !(file instanceof File)) throw new AppError("A PDF file and valid buildingId are required", 400, ErrorCode.BAD_REQUEST);
	return successResponse(c, await contractUploadService.upload({ file, buildingId: parsed.data.buildingId, tier: parsed.data.tier, customer: typeof body.customer === "string" ? body.customer : undefined }), 201);
});
export default upload;
