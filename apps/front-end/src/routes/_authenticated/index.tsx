import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
	component: FoundationPage,
});

function FoundationPage() {
	return (
		<section className="mx-auto max-w-2xl py-10">
			<h1 className="text-2xl font-semibold tracking-tight">DispatchPilot</h1>
			<p className="mt-2 text-slate-600">
				The authenticated application foundation is ready for the next architecture phase.
			</p>
		</section>
	);
}
