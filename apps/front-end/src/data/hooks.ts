import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockApi } from "@/data/mock-api";

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
	return useQuery({ queryKey: queryKeys.jobs, queryFn: mockApi.jobs });
}
export function useTechnicians() {
	return useQuery({
		queryKey: queryKeys.technicians,
		queryFn: mockApi.technicians,
	});
}
export function useContracts() {
	return useQuery({
		queryKey: queryKeys.contracts,
		queryFn: mockApi.contracts,
	});
}
export function useAssignments() {
	return useQuery({
		queryKey: queryKeys.assignments,
		queryFn: mockApi.assignments,
	});
}
export function useApprovals() {
	return useQuery({
		queryKey: queryKeys.approvals,
		queryFn: mockApi.approvals,
	});
}
export function useEvents() {
	return useQuery({ queryKey: queryKeys.events, queryFn: mockApi.events });
}
export function useSimulations() {
	return useQuery({
		queryKey: queryKeys.simulations,
		queryFn: mockApi.simulations,
	});
}
export function useApprovePlan() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: mockApi.approvePlan,
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
		}) => mockApi.updateJobStatus(jobId, status),
		onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.jobs }),
	});
}
export function useApproveItem() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: mockApi.approve,
		onSuccess: () =>
			client.invalidateQueries({ queryKey: queryKeys.approvals }),
	});
}
