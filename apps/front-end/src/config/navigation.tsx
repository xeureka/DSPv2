import type { UserRole } from "@dspv2/shared";
import {
	Buildings,
	ClipboardText,
	FileText,
	Flask,
	GearSix,
	GitDiff,
	ListChecks,
	SealCheck,
	SquaresFour,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

export type NavigationIcon = ComponentType<{
	size?: number;
	weight?: "regular" | "bold" | "fill" | "duotone" | "thin" | "light";
}>;
export type NavigationItem = {
	label: string;
	route: string;
	icon: NavigationIcon;
	allowedRoles: UserRole[];
	badge?: number;
};

export const navigation: NavigationItem[] = [
	{
		label: "Dispatch Board",
		route: "/dispatch",
		icon: SquaresFour,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		label: "Jobs",
		route: "/jobs",
		icon: ClipboardText,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		label: "Plan Review",
		route: "/plan-review",
		icon: GitDiff,
		allowedRoles: ["manager", "dispatcher"],
		badge: 1,
	},
	{
		label: "Contracts and SLA",
		route: "/contracts",
		icon: FileText,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		label: "Assets",
		route: "/assets",
		icon: Buildings,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		label: "Simulator",
		route: "/simulator",
		icon: Flask,
		allowedRoles: ["manager", "dispatcher"],
	},
	{
		label: "Approvals and Activity",
		route: "/activity",
		icon: SealCheck,
		allowedRoles: ["manager", "dispatcher"],
		badge: 5,
	},
	{
		label: "Settings",
		route: "/settings",
		icon: GearSix,
		allowedRoles: ["manager"],
	},
	{
		label: "My Jobs",
		route: "/my-jobs",
		icon: ListChecks,
		allowedRoles: ["technician"],
	},
];

export const existingRoutes = new Set(navigation.map((item) => item.route));
export function navigationForRole(role: UserRole | undefined) {
	return navigation.filter(
		(item) =>
			!!role &&
			item.allowedRoles.includes(role) &&
			existingRoutes.has(item.route),
	);
}
export function navigationForMobile(role: UserRole | undefined) {
	if (role === "technician") return [];
	return navigationForRole(role).filter((item) =>
		["/dispatch", "/jobs", "/activity"].includes(item.route),
	);
}
