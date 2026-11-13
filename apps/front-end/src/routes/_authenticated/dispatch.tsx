import { createFileRoute } from "@tanstack/react-router";
import { DispatchBoardPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/dispatch")({
	beforeLoad: () => requireRole(["manager", "dispatcher"]),
	component: DispatchBoardPage,
});
