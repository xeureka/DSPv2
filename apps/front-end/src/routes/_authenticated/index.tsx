import { createFileRoute, Navigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/")({
	component: DashboardPage,
});

function DashboardPage() {
	const { data: session } = authClient.useSession();
	const role = (session?.user as { role?: string } | undefined)?.role;
	if (role === "technician") return <Navigate to="/my-jobs" replace />;
	return <Navigate to="/dispatch" replace />;
}
