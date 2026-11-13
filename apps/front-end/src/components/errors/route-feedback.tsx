import { useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function RootError({ error }: { error?: unknown }) {
	const router = useRouter();
	if (import.meta.env.DEV) console.error("Route rendering failed", error);
	const message =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: "Something went wrong while loading this dashboard";
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
			<p className="text-5xl font-bold text-status-late">Error</p>
			<p className="text-base font-semibold text-foreground">
				The application hit an unexpected error.
			</p>
			<p className="max-w-sm text-sm text-muted-foreground">{message}</p>
			<div className="mt-2 flex items-center gap-2">
				<Button variant="secondary" onClick={() => router.invalidate()}>
					Try again
				</Button>
				<Button variant="outline" onClick={() => router.history.back()}>
					Go back
				</Button>
			</div>
		</div>
	);
}

export function RootPending() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				<span className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
				Loading…
			</div>
		</div>
	);
}
