import type { auth } from "../lib/auth";
import type { UserRole } from "../db/schema";

type AuthUser = typeof auth.$Infer.Session.user;
type AuthSession = typeof auth.$Infer.Session.session;

export interface AppVariables {
	user: AuthUser | null;
	session: AuthSession | null;
	role: UserRole | null;
}

export type AppEnv = {
	Variables: AppVariables;
};
