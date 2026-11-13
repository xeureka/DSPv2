import { eq } from "drizzle-orm";

import { db, pool } from "@/db";
import type { UserRole } from "@dspv2/shared";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

const seedUsers = [
	[
		"manager",
		"SEED_MANAGER_EMAIL",
		"SEED_MANAGER_NAME",
		"SEED_MANAGER_PASSWORD",
	],
	[
		"dispatcher",
		"SEED_DISPATCHER_EMAIL",
		"SEED_DISPATCHER_NAME",
		"SEED_DISPATCHER_PASSWORD",
	],
	[
		"technician",
		"SEED_TECHNICIAN_EMAIL",
		"SEED_TECHNICIAN_NAME",
		"SEED_TECHNICIAN_PASSWORD",
	],
] as const satisfies readonly [UserRole, string, string, string][];

function required(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} is required to seed development users`);
	return value;
}

export async function seedStaffUsers() {
	const context = await auth.$context;

	const linkCredentialAccount = async (userId: string, password: string) => {
		const passwordHash = await context.password.hash(password);
		await context.internalAdapter.linkAccount({
			userId,
			providerId: "credential",
			issuer: "local:credential",
			accountId: userId,
			password: passwordHash,
		});
	};

	for (const [role, emailKey, nameKey, passwordKey] of seedUsers) {
		const email = required(emailKey);
		const name = required(nameKey);
		const password = required(passwordKey);
		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing[0]) {
			await db
				.update(users)
				.set({ role, name })
				.where(eq(users.id, existing[0].id));
			const credentialAccount =
				await context.internalAdapter.findCredentialAccount(existing[0].id);
			if (!credentialAccount) {
				await linkCredentialAccount(existing[0].id, password);
			}
			continue;
		}

		const user = await context.internalAdapter.createUser(
			{ name, email, emailVerified: false, role },
			{ method: "email-password" },
		);
		await linkCredentialAccount(user.id, password);
	}

	console.log("Seeded one development user for each staff role.");
}

if (process.argv[1]?.endsWith("/seed.ts")) {
	seedStaffUsers()
		.catch(() => {
			console.error("Seed failed; credential values were not logged.");
			process.exitCode = 1;
		})
		.finally(() => pool.end());
}
