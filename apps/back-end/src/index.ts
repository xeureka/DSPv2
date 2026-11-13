import { serve } from "@hono/node-server";
import app from "./app";
import "./lib/env";

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const hostname = "0.0.0.0";

function logFatalError(label: string, error: unknown) {
	console.error(label, error);
	if (error instanceof Error && error.stack) {
		console.error(error.stack);
	}
}

process.on("uncaughtException", (error) => {
	logFatalError("Uncaught exception:", error);
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	logFatalError("Unhandled rejection:", reason);
	process.exit(1);
});

async function main() {
	const server = serve(
		{
			fetch: app.fetch,
			port,
			hostname,
		},
		(info) => {
			console.log(`DSPv2 API running on http://localhost:${info.port}`);
			console.log(`API Documentation: http://localhost:${info.port}/docs`);
			console.log(`OpenAPI JSON: http://localhost:${info.port}/openapi.json`);
		},
	);

	server.on("error", (err) => {
		if (
			err &&
			typeof err === "object" &&
			"code" in err &&
			(err as any).code === "EADDRINUSE"
		) {
			console.error(
				`Port ${port} is already in use. A previous instance may still be running.\n` +
					`Kill it with:  kill -9 $(pgrep -f "tsx src/index")   then restart.`,
			);
			logFatalError("Server listen error:", err);
			process.exit(1);
		}
		logFatalError("Server error:", err);
	});

	process.on("SIGTERM", () => {
		server.close(() => process.exit(0));
	});
	process.on("SIGINT", () => {
		server.close(() => process.exit(0));
	});
}

main().catch((error) => {
	logFatalError("Failed to start application:", error);
	process.exit(1);
});
