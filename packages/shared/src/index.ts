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
