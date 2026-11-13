import { createFileRoute } from "@tanstack/react-router";
import { AssetsPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/assets")({
	beforeLoad: () => requireRole(["manager", "dispatcher"]),
	component: AssetsPage,
});
