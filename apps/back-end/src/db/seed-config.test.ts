import assert from "node:assert/strict";
import test from "node:test";

import { getSeedUsers } from "./seed-config";

test("seed defaults provide one credential account for every staff role", () => {
	const users = getSeedUsers({});

	assert.deepEqual(
		users.map(({ role, email, name, password }) => ({
			role,
			email,
			name,
			password,
		})),
		[
			{
				role: "manager",
				email: "manager@dispatchpilot.local",
				name: "DispatchPilot Manager",
				password: "DispatchPilotManager123!",
			},
			{
				role: "dispatcher",
				email: "dispatcher@dispatchpilot.local",
				name: "DispatchPilot Dispatcher",
				password: "DispatchPilotDispatcher123!",
			},
			{
				role: "technician",
				email: "technician@dispatchpilot.local",
				name: "DispatchPilot Technician",
				password: "DispatchPilotTechnician123!",
			},
		],
	);
});

test("seed environment variables override individual defaults", () => {
	const users = getSeedUsers({
		SEED_MANAGER_EMAIL: "manager@example.com",
		SEED_MANAGER_NAME: "Custom Manager",
		SEED_MANAGER_PASSWORD: "custom-password",
	});

	assert.equal(users[0]?.email, "manager@example.com");
	assert.equal(users[0]?.name, "Custom Manager");
	assert.equal(users[0]?.password, "custom-password");
	assert.equal(users[1]?.email, "dispatcher@dispatchpilot.local");
});
