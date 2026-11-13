import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/operations/components/dashboard-pages";
import { requireRole } from "@/routes/-route-guards";
export const Route = createFileRoute("/_authenticated/settings")({
	beforeLoad: () => requireRole(["manager"]),
	component: SettingsPage,
});
