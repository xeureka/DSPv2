import { createFileRoute } from "@tanstack/react-router";
import { PlanReviewPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/plan-review")({
	beforeLoad: () => requireRole(["manager", "dispatcher"]),
	component: PlanReviewPage,
});
