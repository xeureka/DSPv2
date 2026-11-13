import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function sendResetPasswordEmail(input: {
	email: string;
	url: string;
}) {
	if (env.NODE_ENV !== "production" || env.DRY_RUN) {
		logger.info({ resetLink: input.url }, "Password reset link generated");
		return;
	}

	logger.warn("Password reset email sender is not configured");
}
