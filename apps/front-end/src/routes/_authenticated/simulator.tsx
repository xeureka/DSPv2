import { createFileRoute } from "@tanstack/react-router";
import { SimulatorPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/simulator")({
	beforeLoad: () => requireRole(["manager", "dispatcher"]),
	component: SimulatorPage,
});
