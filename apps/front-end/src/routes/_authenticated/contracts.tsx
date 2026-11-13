import { createFileRoute } from "@tanstack/react-router";
import { ContractsPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/contracts")({
	beforeLoad: () => requireRole(["manager", "dispatcher"]),
	component: ContractsPage,
});
