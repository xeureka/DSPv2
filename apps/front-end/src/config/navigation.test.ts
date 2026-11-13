import assert from "node:assert/strict";
import test from "node:test";
import { navigationForRole } from "./navigation";

test("navigation only includes routes that exist and are allowed for the role", () => {
	assert.deepEqual(
		navigationForRole("manager").map((item) => item.label),
		[
			"Dispatch Board",
			"Jobs",
			"Plan Review",
			"Contracts and SLA",
			"Assets",
			"Simulator",
			"Approvals and Activity",
			"Settings",
		],
	);
	assert.deepEqual(
		navigationForRole("technician").map((item) => item.label),
		["My Jobs"],
	);
	assert.equal(
		navigationForRole("technician").some((item) => item.label === "Settings"),
		false,
	);
});
