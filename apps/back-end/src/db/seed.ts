import { eq } from "drizzle-orm";

import { db } from "@/db";
import type { UserRole } from "@dspv2/shared";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

const seedUsers = [
	["manager", "SEED_MANAGER_EMAIL", "SEED_MANAGER_PASSWORD", "Dispatch Manager"],
	[
		"dispatcher",
		"SEED_DISPATCHER_EMAIL",
		"SEED_DISPATCHER_PASSWORD",
		"Dispatch Coordinator",
	],
	[
		"technician",
		"SEED_TECHNICIAN_EMAIL",
		"SEED_TECHNICIAN_PASSWORD",
		"Field Technician",
	],
] as const satisfies readonly [UserRole, string, string, string][];

function required(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} is required to seed development users`);
	return value;
}

async function main() {
	for (const [role, emailKey, passwordKey, name] of seedUsers) {
		const email = required(emailKey);
		const password = required(passwordKey);
		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing[0]) {
			await db.update(users).set({ role }).where(eq(users.id, existing[0].id));
			continue;
		}

		const result = await auth.api.signUpEmail({
			body: { name, email, password },
		});
		if (!result.user) throw new Error(`Could not create ${role} seed user`);
		await db.update(users).set({ role }).where(eq(users.id, result.user.id));
	}

	console.log("Seeded one development user for each staff role.");
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
