import type { UserRole } from "@dspv2/shared";

export type SeedUser = {
	role: UserRole;
	email: string;
	name: string;
	password: string;
	emailEnv: string;
	nameEnv: string;
	passwordEnv: string;
};

const defaultSeedUsers = [
	{
		role: "manager",
		email: "manager@dispatchpilot.local",
		name: "DispatchPilot Manager",
		password: "DispatchPilotManager123!",
		emailEnv: "SEED_MANAGER_EMAIL",
		nameEnv: "SEED_MANAGER_NAME",
		passwordEnv: "SEED_MANAGER_PASSWORD",
	},
	{
		role: "dispatcher",
		email: "dispatcher@dispatchpilot.local",
		name: "DispatchPilot Dispatcher",
		password: "DispatchPilotDispatcher123!",
		emailEnv: "SEED_DISPATCHER_EMAIL",
		nameEnv: "SEED_DISPATCHER_NAME",
		passwordEnv: "SEED_DISPATCHER_PASSWORD",
	},
	{
		role: "technician",
		email: "technician@dispatchpilot.local",
		name: "DispatchPilot Technician",
		password: "DispatchPilotTechnician123!",
		emailEnv: "SEED_TECHNICIAN_EMAIL",
		nameEnv: "SEED_TECHNICIAN_NAME",
		passwordEnv: "SEED_TECHNICIAN_PASSWORD",
	},
] as const satisfies readonly SeedUser[];

export function getSeedUsers(
	processEnv: NodeJS.ProcessEnv = process.env,
): SeedUser[] {
	return defaultSeedUsers.map((user) => ({
		...user,
		email: processEnv[user.emailEnv]?.trim() || user.email,
		name: processEnv[user.nameEnv]?.trim() || user.name,
		password: processEnv[user.passwordEnv] || user.password,
	}));
}
