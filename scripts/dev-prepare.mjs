import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const envFile = "apps/back-end/.env";
const fileEnv = {};
if (existsSync(envFile)) {
	for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
		const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
		if (!match || match[1] in process.env) continue;
		fileEnv[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
	}
}

const nodeEnv = process.env.NODE_ENV ?? fileEnv.NODE_ENV ?? "development";
if (nodeEnv === "production") {
	console.error("Refusing to seed a production database from pnpm dev.");
	process.exit(1);
}

if (!(process.env.DATABASE_URL ?? fileEnv.DATABASE_URL)) {
	console.error("DATABASE_URL is required in apps/back-end/.env before pnpm dev.");
	process.exit(1);
}

console.log("Preparing the configured DATABASE_URL with migrations and deterministic development seed data.");
for (const command of ["db:migrate", "seed"]) {
	const result = spawnSync("pnpm", ["--filter", "@dspv2/backend", command], {
		stdio: "inherit",
		env: { ...process.env, NODE_ENV: "development" },
	});
	if (result.status !== 0) process.exit(result.status ?? 1);
}
