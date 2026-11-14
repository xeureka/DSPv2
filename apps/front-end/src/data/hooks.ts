import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockApi } from "@/data/mock-api";
import { liveApi } from "@/data/api-client";
import { USE_MOCK_DATA } from "@/lib/env";

const dataApi = USE_MOCK_DATA ? mockApi : liveApi;

export const queryKeys = {
	jobs: ["jobs"],
	technicians: ["technicians"],
	contracts: ["contracts"],
	assignments: ["assignments"],
	approvals: ["approvals"],
	events: ["events"],
	simulations: ["simulations"],
} as const;
export function useJobs() {
	return useQuery({ queryKey: queryKeys.jobs, queryFn: dataApi.jobs });
}
export function useTechnicians() {
	return useQuery({
		queryKey: queryKeys.technicians,
		queryFn: dataApi.technicians,
	});
}
export function useContracts() {
	return useQuery({
		queryKey: queryKeys.contracts,
		queryFn: dataApi.contracts,
	});
}
export function useAssignments() {
	return useQuery({
		queryKey: queryKeys.assignments,
		queryFn: dataApi.assignments,
	});
}
export function useApprovals() {
	return useQuery({
		queryKey: queryKeys.approvals,
		queryFn: dataApi.approvals,
	});
}
export function useEvents() {
	return useQuery({ queryKey: queryKeys.events, queryFn: dataApi.events });
}
export function useSimulations() {
	return useQuery({
		queryKey: queryKeys.simulations,
		queryFn: dataApi.simulations,
	});
}
export function useApprovePlan() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: dataApi.approvePlan,
		onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.jobs }),
	});
}
export function useUpdateJobStatus() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({
			jobId,
			status,
		}: {
			jobId: string;
			status: Parameters<typeof mockApi.updateJobStatus>[1];
		}) => dataApi.updateJobStatus(jobId, status),
		onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.jobs }),
	});
}
export function useApproveItem() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: dataApi.approve,
		onSuccess: () =>
			client.invalidateQueries({ queryKey: queryKeys.approvals }),
	});
}
export function useApproveContract() {
	const client = useQueryClient();
	return useMutation({ mutationFn: dataApi.approveContract, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.contracts }) });
}
export function useRunSimulation() {
	const client = useQueryClient();
	return useMutation({ mutationFn: dataApi.runSimulation, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.simulations }) });
}
