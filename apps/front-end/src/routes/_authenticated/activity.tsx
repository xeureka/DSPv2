import { createFileRoute } from "@tanstack/react-router";
import { ActivityPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/activity")({
	beforeLoad: () => requireRole(["manager", "dispatcher"]),
	component: ActivityPage,
});
