import "dotenv/config";
import { z } from "zod";

export const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().int().positive().max(65535).default(3000),
	HOST: z.string().default("0.0.0.0"),
	DATABASE_URL: z
		.string()
		.startsWith("postgres", "DATABASE_URL must be a PostgreSQL connection URL")
		.url("DATABASE_URL must be a valid PostgreSQL connection URL"),
	BETTER_AUTH_SECRET: z
		.string()
		.trim()
		.min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
	BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
	WEB_APP_URL: z.string().url("WEB_APP_URL must be a valid URL"),
	CORS_ORIGINS: z.string().min(1, "CORS_ORIGINS must not be empty"),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	DRY_RUN: z.preprocess(
		(value) =>
			typeof value === "string" ? value.toLowerCase() === "true" : value,
		z.boolean().default(true),
	),
	GEMINI_API_KEY: z.string().trim().min(1).optional(),
	GEMINI_MODEL: z.string().trim().default("gemini-3.8-flash"),
	GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(8_000),
	GEMINI_CALL_BUDGET: z.coerce.number().int().positive().default(3),
	SCHEDULER_SECRET: z.string().optional(),
	DEMO_MODE: z.preprocess((value) => typeof value === "string" ? value.toLowerCase() === "true" : value, z.boolean().default(false)),
	CONTRACT_UPLOAD_DIR: z.string().default("./var/private-contracts"),
	LOG_LEVEL: z
		.enum(["trace", "debug", "info", "warn", "error", "fatal"])
		.default("info"),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
	return envSchema.safeParse(input);
}

const parsedEnv = parseEnv(process.env);

if (!parsedEnv.success) {
	console.error("Invalid environment variables:");
	for (const issue of parsedEnv.error.issues) {
		console.error(` - ${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const env = parsedEnv.data;
export type Env = typeof env;
