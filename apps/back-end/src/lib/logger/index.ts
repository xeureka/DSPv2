import pino from "pino";
import { env } from "@/lib/env";
import { serializeError } from "./serializers";

export const logger = pino({
	name: "dspv2-api",
	level: env.LOG_LEVEL,
	base: {
		service: "dspv2-api",
		environment: env.NODE_ENV,
	},
	serializers: {
		err: serializeError,
	},

	redact: {
		paths: [
			"password",
			"token",
			"accessToken",
			"refreshToken",
			"authorization",
			"cookie",
			"req.headers.authorization",
			"req.headers.cookie",
			"req.headers.KEY",
			"SMS_ETHIOPIA",
			"otp",
		],
		censor: "[REDACTED]",
	},
	transport:
		env.NODE_ENV === "development"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						singleLine: true,
					},
				}
			: undefined,
});
