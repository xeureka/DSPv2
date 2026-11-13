import {
	ClipboardText,
	Plus,
	Timer,
	WarningCircle,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	EmptyAction,
	EmptyState,
	FilterBar,
	PageHeader,
	StatCard,
	StatusBadge,
} from "@/components/layout/page-blocks";

export const Route = createFileRoute("/_authenticated/")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="mx-auto max-w-[1440px] space-y-6">
			<PageHeader
				title="Operations overview"
				description="A clear starting point for the work that needs attention."
				actions={
					<Button disabled>
						<Plus aria-hidden="true" size={17} />
						Create request
					</Button>
				}
			/>
			<FilterBar>
				<div className="flex flex-wrap gap-2">
					<Button variant="secondary" size="sm" disabled>
						Today
					</Button>
					<Button variant="outline" size="sm" disabled>
						All teams
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">
					Live data will appear when operations modules are connected.
				</p>
			</FilterBar>
			<section
				aria-label="Key metrics"
				className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
			>
				<StatCard
					label="Open requests"
					helper="No request data connected yet"
					empty
				/>
				<StatCard label="SLA watch" helper="No SLA data connected yet" empty />
				<StatCard
					label="Technician capacity"
					helper="No schedule data connected yet"
					empty
				/>
			</section>
			<section className="grid gap-4 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Work needing attention</CardTitle>
							<p className="mt-1 text-sm text-muted-foreground">
								Prioritised work will appear here.
							</p>
						</div>
						<StatusBadge status="attention" />
					</CardHeader>
					<CardContent>
						<EmptyState
							icon={WarningCircle}
							title="Nothing to review yet"
							explanation="The dispatch board and SLA engine will provide attention items here."
							action={<EmptyAction>Open dispatch board</EmptyAction>}
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Today’s plan</CardTitle>
						<p className="mt-1 text-sm text-muted-foreground">
							The day view will be available in the next architecture phase.
						</p>
					</CardHeader>
					<CardContent>
						<EmptyState
							icon={Timer}
							title="No plan loaded"
							explanation="No scheduling data exists in this foundation."
						/>
					</CardContent>
				</Card>
			</section>
			<Card>
				<CardHeader>
					<CardTitle>Recent activity</CardTitle>
					<p className="mt-1 text-sm text-muted-foreground">
						Events will be listed once the event log is connected.
					</p>
				</CardHeader>
				<CardContent>
					<EmptyState
						icon={ClipboardText}
						title="No activity yet"
						explanation="There is no operational activity to show."
					/>
				</CardContent>
			</Card>
		</div>
	);
}
