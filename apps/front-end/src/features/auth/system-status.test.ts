import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchSystemStatus } from "./system-status";

describe("fetchSystemStatus", () => {
	it("reports operational when readiness succeeds", async () => {
		assert.equal(
			await fetchSystemStatus(async () => ({ status: "ok" })),
			"operational",
		);
	});

	it("reports degraded for a server readiness failure", async () => {
		assert.equal(
			await fetchSystemStatus(async () => {
				throw { status: 503 };
			}),
			"degraded",
		);
	});

	it("reports unreachable for a network failure", async () => {
		assert.equal(
			await fetchSystemStatus(async () => {
				throw new Error("offline");
			}),
			"unreachable",
		);
	});
});
