import { createFileRoute } from "@tanstack/react-router";
import { JobsPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/jobs")({
	beforeLoad: () => requireRole(["manager", "dispatcher"]),
	component: JobsPage,
});
