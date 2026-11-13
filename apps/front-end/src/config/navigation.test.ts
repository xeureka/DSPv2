import assert from "node:assert/strict";
import test from "node:test";
import { navigationForRole } from "./navigation";

test("navigation only includes routes that exist and are allowed for the role", () => {
	assert.deepEqual(
		navigationForRole("manager").map((item) => item.label),
		["Overview"],
	);
	assert.deepEqual(navigationForRole("technician"), []);
});
