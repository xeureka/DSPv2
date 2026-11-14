type WorkerBindings = Record<string, string | undefined> & {
	CONTRACT_BUCKET?: {
		put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType: string } }): Promise<unknown>;
	};
};
type WorkerExecutionContext = {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
};

let appPromise: Promise<typeof import("./app")> | undefined;

function configureRuntime(bindings: WorkerBindings) {
	for (const [key, value] of Object.entries(bindings)) {
		if (typeof value === "string" && value.length > 0) process.env[key] = value;
	}
	if (bindings.CONTRACT_BUCKET) {
		(globalThis as typeof globalThis & { __DISPATCHPILOT_CONTRACT_BUCKET__?: WorkerBindings["CONTRACT_BUCKET"] }).__DISPATCHPILOT_CONTRACT_BUCKET__ = bindings.CONTRACT_BUCKET;
	}
}

export default {
	async fetch(request: Request, bindings: WorkerBindings, executionContext: WorkerExecutionContext) {
		configureRuntime(bindings);
		appPromise ??= import("./app");
		const { default: app } = await appPromise;
		return app.fetch(
			request,
			bindings,
			executionContext as Parameters<typeof app.fetch>[2],
		);
	},
};
