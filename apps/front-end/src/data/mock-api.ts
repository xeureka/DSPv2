import type {
	Approval,
	Assignment,
	Contract,
	Event,
	Job,
	SimulationRun,
	Technician,
} from "@dspv2/shared";
import { mockDb } from "@/mocks/data";

const wait = (value: number) =>
	new Promise((resolve) => window.setTimeout(resolve, value));

export const mockApi = {
	async jobs() {
		await wait(240);
		return [...mockDb.jobs];
	},
	async technicians() {
		await wait(280);
		return [...mockDb.technicians];
	},
	async contracts() {
		await wait(220);
		return [...mockDb.contracts];
	},
	async assignments() {
		await wait(260);
		return [...mockDb.assignments];
	},
	async approvals() {
		await wait(260);
		return [...mockDb.approvals];
	},
	async events() {
		await wait(300);
		return [...mockDb.events];
	},
	async simulations() {
		await wait(320);
		return [...mockDb.simulationRuns];
	},
	async approvePlan() {
		await wait(240);
		return { moved: 1, slaBreaches: 0, travelDelta: 4 };
	},
	async updateJobStatus(jobId: string, status: Job["status"]) {
		await wait(220);
		const job = mockDb.jobs.find((item) => item.id === jobId);
		if (job) job.status = status;
		return job;
	},
	async approve(id: string) {
		await wait(220);
		const item = mockDb.approvals.find((approval) => approval.id === id);
		if (item) item.status = "approved";
		return item;
	},
	async approveContract(id: string) {
		await wait(220);
		const contract = mockDb.contracts.find((item) => item.id === id);
		if (contract) contract.status = "Active";
		return contract;
	},
	async runSimulation(input: { days: number; seed: number; scenario: SimulationRun["scenario"] }) {
		await wait(320);
		return mockDb.simulationRuns.find((item) => item.scenario === input.scenario);
	},
};

export type MockData = {
	jobs: Job[];
	technicians: Technician[];
	contracts: Contract[];
	assignments: Assignment[];
	approvals: Approval[];
	events: Event[];
	simulations: SimulationRun[];
};
