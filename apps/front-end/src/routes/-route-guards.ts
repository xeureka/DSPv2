import { redirect } from "@tanstack/react-router";
import type { UserRole } from "@dspv2/shared";
import { authClient } from "@/lib/auth-client";

export async function requireRole(roles: UserRole[]) {
	const session = await authClient.getSession();
	const role = (session.data?.user as { role?: UserRole } | undefined)?.role;
	if (!session.data?.user) throw redirect({ to: "/login" });
	if (!role || !roles.includes(role))
		throw redirect({ to: role === "technician" ? "/my-jobs" : "/dispatch" });
}
