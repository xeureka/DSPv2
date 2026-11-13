import type { UserRole } from "@dspv2/shared";
import {
	ChartLineUp,
	ClipboardText,
	Gauge,
	GearSix,
	MapTrifold,
	Package,
	ShieldCheck,
	SquaresFour,
	UsersThree,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

export type NavigationIcon = ComponentType<{
	size?: number;
	weight?: "regular" | "bold" | "fill" | "duotone" | "thin" | "light";
}>;
export type NavigationItem = {
	group: "Operate" | "Compliance" | "Insights" | "Manage";
	label: string;
	route: string;
	icon: NavigationIcon;
	allowedRoles: UserRole[];
};

export const navigation: NavigationItem[] = [
	{
		group: "Operate",
		label: "Overview",
		route: "/",
		icon: SquaresFour,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Operate",
		label: "Dispatch Board",
		route: "/dispatch",
		icon: Gauge,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Operate",
		label: "Jobs",
		route: "/jobs",
		icon: ClipboardText,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Operate",
		label: "My Jobs",
		route: "/my-jobs",
		icon: Package,
		allowedRoles: ["technician"],
	},
	{
		group: "Operate",
		label: "Plan Review",
		route: "/plan-review",
		icon: ChartLineUp,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Operate",
		label: "Map",
		route: "/map",
		icon: MapTrifold,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Compliance",
		label: "Contracts and SLA",
		route: "/contracts",
		icon: ShieldCheck,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Compliance",
		label: "Assets",
		route: "/assets",
		icon: Package,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Insights",
		label: "Simulator",
		route: "/simulator",
		icon: ChartLineUp,
		allowedRoles: ["manager"],
	},
	{
		group: "Insights",
		label: "Approvals and Activity",
		route: "/activity",
		icon: UsersThree,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		group: "Manage",
		label: "Settings",
		route: "/settings",
		icon: GearSix,
		allowedRoles: ["manager"],
	},
];

const existingRoutes = new Set(["/"]);
export function navigationForRole(role: UserRole | undefined) {
	return navigation.filter(
		(item) =>
			existingRoutes.has(item.route) &&
			!!role &&
			item.allowedRoles.includes(role),
	);
}

export function navigationGroups(role: UserRole | undefined) {
	return ["Operate", "Compliance", "Insights", "Manage"]
		.map((group) => ({
			group,
			items: navigationForRole(role).filter((item) => item.group === group),
		}))
		.filter((section) => section.items.length > 0);
}
