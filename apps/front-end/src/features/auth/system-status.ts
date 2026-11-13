export type SystemStatusState =
	| "loading"
	| "operational"
	| "degraded"
	| "unreachable";

export async function fetchSystemStatus(
	check: () => Promise<unknown>,
): Promise<SystemStatusState> {
	try {
		await check();
		return "operational";
	} catch (error) {
		const status =
			typeof error === "object" && error !== null && "status" in error
				? (error as { status?: unknown }).status
				: undefined;
		return typeof status === "number" && status >= 500
			? "degraded"
			: "unreachable";
	}
}
