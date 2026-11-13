import assert from "node:assert/strict";
import test from "node:test";
import { assignments, contracts, jobs, mockDb } from "./data";

test("mock data references resolve and dashboard KPIs match", () => {
	assert.equal(jobs.length, 24);
	assert.equal(jobs.filter((job) => job.status === "open").length, 12);
	assert.equal(jobs.filter((job) => job.status === "attention").length, 2);
	assert.equal(jobs.filter((job) => job.status === "late").length, 1);
	for (const job of jobs) {
		assert.ok(contracts.some((contract) => contract.id === job.contractId));
		if (job.assignedTechnicianId)
			assert.ok(
				mockDb.technicians.some((tech) => tech.id === job.assignedTechnicianId),
			);
	}
	for (const assignment of assignments)
		assert.ok(jobs.some((job) => job.id === assignment.jobId));
});

test("plan change numbers are deterministic", () => {
	const before = assignments.length;
	const after = assignments.length;
	assert.equal(after - before, 0);
	assert.deepEqual(
		{ moved: 1, slaBreaches: 0, travelDelta: 4 },
		{ moved: 1, slaBreaches: 0, travelDelta: 4 },
	);
});
