import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			users: schema.users,
			accounts: schema.accounts,
			sessions: schema.sessions,
			verifications: schema.verifications,
		},
	}),
	trustedOrigins: [env.WEB_APP_URL],
	user: {
		modelName: "users",
		additionalFields: {
			role: {
				type: "string",
				required: true,
				input: false,
				defaultValue: "technician",
			},
		},
		fields: {
			emailVerified: "emailVerified",
		},
	},
	account: {
		modelName: "accounts",
		fields: {
			userId: "userId",
			accountId: "accountId",
			providerId: "providerId",
			accessToken: "accessToken",
			refreshToken: "refreshToken",
			accessTokenExpiresAt: "accessTokenExpiresAt",
			refreshTokenExpiresAt: "refreshTokenExpiresAt",
			password: "password",
		},
	},
	session: {
		modelName: "sessions",
		fields: {
			userId: "userId",
			token: "token",
			expiresAt: "expiresAt",
			ipAddress: "ipAddress",
			userAgent: "userAgent",
		},
	},
	verification: {
		modelName: "verifications",
		fields: {
			identifier: "identifier",
			value: "value",
			expiresAt: "expiresAt",
		},
	},
	advanced: {
		database: {
			generateId: false,
		},
		generateId: false,
	},
	emailAndPassword: {
		enabled: true,
	},
});
