import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { sendResetPasswordEmail } from "@/lib/email";

export const googleSignInConfigured = Boolean(
	env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	plugins: [
		openAPI({
			disableDefaultReference: false,
			theme: "purple",
		}),
	],
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
			issuer: "issuer",
			accessToken: "accessToken",
			refreshToken: "refreshToken",
			accessTokenExpiresAt: "accessTokenExpiresAt",
			refreshTokenExpiresAt: "refreshTokenExpiresAt",
			password: "password",
		},
		accountLinking: {
			enabled: true,
			disableImplicitLinking: false,
			trustedProviders: ["google"],
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
		disableSignUp: true,
		resetPasswordTokenExpiresIn: 3600,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			await sendResetPasswordEmail({ email: user.email, url });
		},
	},
	...(googleSignInConfigured
		? {
				socialProviders: {
					google: {
						clientId: env.GOOGLE_CLIENT_ID as string,
						clientSecret: env.GOOGLE_CLIENT_SECRET as string,
						disableSignUp: true,
					},
				},
			}
		: {}),
});
