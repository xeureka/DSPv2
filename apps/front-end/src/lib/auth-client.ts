import { createAuthClient } from "better-auth/react";

import { AUTH_BASE_URL } from "@/lib/env";

export const authClient = createAuthClient({
	baseURL: `${AUTH_BASE_URL}/api/auth`,
	fetchOptions: {
		credentials: "include",
	},
});
