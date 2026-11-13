import { createFileRoute } from "@tanstack/react-router";
import { MyJobsPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/my-jobs")({
	beforeLoad: () => requireRole(["technician"]),
	component: MyJobsPage,
});
