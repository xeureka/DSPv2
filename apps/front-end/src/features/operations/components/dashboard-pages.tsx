import { useState } from "react";
import {
	ArrowRight,
	Check,
	CheckCircle,
	Clock,
	Flask,
	MapPin,
	NavigationArrow,
	Play,
	Plus,
	SlidersHorizontal,
	Warning,
	Wrench,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	EmptyState,
	FilterBar,
	PageHeader,
	StatCard,
	StatusBadge,
} from "@/components/layout/page-blocks";
import {
	useApproveItem,
	useApproveContract,
	useApprovePlan,
	useApprovals,
	useContracts,
	useEvents,
	useJobs,
	useSimulations,
	useTechnicians,
	useUpdateJobStatus,
	useRunSimulation,
} from "@/data/hooks";
import { mockNow } from "@/mocks/data";
import { authClient } from "@/lib/auth-client";

const statusForBadge = (status: string) =>
	status === "late"
		? "late"
		: status === "attention"
			? "attention"
			: status === "done"
				? "ok"
				: "scheduled";
const formatTime = (value: string) =>
	new Date(value).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
function LoadingCards() {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			{[1, 2, 3].map((item) => (
				<Card key={item}>
					<CardContent className="space-y-3 p-5">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-3 w-40" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function DispatchBoardPage() {
	const jobs = useJobs();
	const technicians = useTechnicians();
	const approvals = useApprovals();
	if (jobs.isLoading || technicians.isLoading || approvals.isLoading)
		return <LoadingCards />;
	if (jobs.isError || technicians.isError)
		return (
			<EmptyState
				icon={Warning}
				title="Board unavailable"
				explanation="The demo data adapter could not load the dispatch board."
				action={
					<Button
						onClick={() => {
							void jobs.refetch();
						}}
					>
						Try again
					</Button>
				}
			/>
		);
	const jobList = jobs.data ?? [];
	const technicianList = technicians.data ?? [];
	const approvalList = approvals.data ?? [];
	const attention = jobList.filter(
		(job) => job.status === "attention" || job.status === "late",
	);
	return (
		<div className="mx-auto max-w-[1440px] space-y-6">
			<PageHeader
				title="Dispatch Board"
				description="See today's work, ownership, and the exceptions that need a decision."
				breadcrumbs={["Operate", "Dispatch Board"]}
				actions={
					<Button
						onClick={() =>
							toast.info("Command parsing arrives with the AI layer.")
						}
					>
						<SlidersHorizontal size={17} /> Ask the dispatcher
					</Button>
				}
			/>
			<div className="rounded-xl border border-status-attention/30 bg-status-attention-soft p-4 text-sm text-status-attention-text">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<span className="flex items-center gap-2">
						<Warning size={18} weight="fill" /> Hana is running late 25 min
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.location.assign("/plan-review")}
					>
						Review plan <ArrowRight size={15} />
					</Button>
				</div>
			</div>
			<FilterBar>
				<div className="flex w-full flex-wrap items-center gap-2">
					<Input className="h-9 max-w-xs" placeholder="Ask the dispatcher..." />
					<Button variant="secondary" size="sm">
						Today
					</Button>
					<Badge variant="secondary" className="ml-auto rounded-full">
						Demo data · {mockNow.slice(0, 10)}
					</Badge>
				</div>
			</FilterBar>
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Open jobs"
					value="12"
					helper="Jobs waiting for completion"
					delta="today"
				/>
				<StatCard
					label="SLA met"
					value="94%"
					helper="Across today's plan"
					delta="+3%"
				/>
				<StatCard
					label="At risk"
					value="2"
					helper="Need a decision soon"
					delta="watch"
				/>
				<StatCard
					label="Late"
					value="1"
					helper="Requires re-plan"
					delta="urgent"
				/>
			</section>
			<section className="grid gap-4 xl:grid-cols-[1.6fr_0.8fr]">
				<Card>
					<CardHeader>
						<CardTitle>Technician timelines</CardTitle>
						<p className="text-sm text-muted-foreground">
							08:00–17:00 · now is 10:30
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						{technicianList.map((technician) => {
							const assigned = jobList
								.filter((job) => job.assignedTechnicianId === technician.id)
								.slice(0, 3);
							return (
								<div key={technician.id} className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium">{technician.name}</span>
										<span className="text-xs text-muted-foreground">
											{technician.status === "late"
												? "25 min late"
												: technician.skills[0].name}
										</span>
									</div>
									<div className="relative grid min-h-12 grid-cols-9 gap-1 rounded-lg bg-muted p-1">
										<span className="absolute bottom-0 left-[28%] top-0 border-l border-status-late/60" />
										{assigned.map((job, index) => (
											<div
												key={job.id}
												className={`z-10 flex min-w-0 items-center rounded-md px-2 text-[10px] font-medium ${job.status === "late" ? "bg-status-late-soft text-status-late-text" : job.status === "attention" ? "bg-status-attention-soft text-status-attention-text" : "bg-status-scheduled-soft text-status-scheduled-text"}`}
												style={{
													gridColumn: `${Math.min(index * 2 + 1, 8)} / span 2`,
												}}
											>
												{job.title}
											</div>
										))}
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Needs attention</CardTitle>
						<p className="text-sm text-muted-foreground">
							The next decisions for the team.
						</p>
					</CardHeader>
					<CardContent className="space-y-3">
						{attention.map((job) => (
							<div key={job.id} className="rounded-lg border border-border p-3">
								<div className="flex items-start justify-between gap-2">
									<p className="text-sm font-medium">{job.title}</p>
									<StatusBadge
										status={statusForBadge(job.status) as "late" | "attention"}
									/>
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									{job.customer} · SLA due {formatTime(job.slaDueAt)}
								</p>
							</div>
						))}
						<div className="rounded-lg bg-status-attention-soft p-3 text-sm text-status-attention-text">
							<span className="font-semibold">
								{
									approvalList.filter((item) => item.status === "pending")
										.length
								}
							</span>{" "}
							approvals pending
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

export function JobsPage() {
	const { data: jobs, isLoading } = useJobs();
	const [selected, setSelected] = useState<string | null>("JOB-001");
	const selectedJob = jobs?.find((job) => job.id === selected);
	if (isLoading || !jobs) return <LoadingCards />;
	return (
		<div className="mx-auto max-w-[1440px] space-y-6">
			<PageHeader
				title="Jobs"
				description="Filter requests, inspect the evidence, and make the next assignment decision."
				breadcrumbs={["Operate", "Jobs"]}
				actions={
					<Button
						onClick={() =>
							toast.info("Job intake arrives with the next architecture phase.")
						}
					>
						<Plus size={17} /> New request
					</Button>
				}
			/>
			<FilterBar>
				<div className="flex w-full flex-wrap gap-2">
					<Input className="h-9 max-w-sm" placeholder="Search jobs" />
					<Button variant="secondary" size="sm">
						All statuses
					</Button>
					<Button variant="outline" size="sm">
						All skills
					</Button>
					<Button variant="outline" size="sm">
						Safety only
					</Button>
				</div>
			</FilterBar>
			<Card>
				<CardContent className="p-0">
					<div className="hidden md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Job</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Skill</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>SLA due</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{jobs.map((job) => (
									<TableRow
										key={job.id}
										className="cursor-pointer"
										onClick={() => setSelected(job.id)}
									>
										<TableCell className="font-medium">
											{job.title}
											<div className="text-[10px] text-muted-foreground">
												{job.id}
											</div>
										</TableCell>
										<TableCell>{job.customer}</TableCell>
										<TableCell>{job.skill}</TableCell>
										<TableCell>
											<StatusBadge
												status={
													statusForBadge(job.status) as
														| "ok"
														| "scheduled"
														| "attention"
														| "late"
												}
											/>
										</TableCell>
										<TableCell>{formatTime(job.slaDueAt)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<div className="grid gap-2 p-3 md:hidden">
						{jobs.map((job) => (
							<button
								key={job.id}
								className="rounded-lg border border-border p-3 text-left"
								onClick={() => setSelected(job.id)}
							>
								<div className="flex justify-between gap-3">
									<span className="font-medium">{job.title}</span>
									<StatusBadge
										status={
											statusForBadge(job.status) as
												| "ok"
												| "scheduled"
												| "attention"
												| "late"
										}
									/>
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									{job.customer} · {job.skill} · SLA {formatTime(job.slaDueAt)}
								</p>
							</button>
						))}
					</div>
				</CardContent>
			</Card>
			{selectedJob ? (
				<Card>
					<CardHeader>
						<CardTitle>
							{selectedJob.title} · {selectedJob.customer}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							{selectedJob.id} · {selectedJob.address}
						</p>
					</CardHeader>
					<CardContent className="grid gap-5 lg:grid-cols-2">
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">Skill: {selectedJob.skill}</Badge>
							<Badge variant="secondary">
								Safety: {selectedJob.safety ? "yes" : "no"}
							</Badge>
							<Badge variant="secondary">
								Confidence: {Math.round(selectedJob.confidence * 100)}%
							</Badge>
						</div>
						<div className="rounded-lg bg-muted p-4 text-sm">
							<p className="font-medium">Agent suggestion</p>
							<p className="mt-1 text-muted-foreground">
								Hana · Elevator level 3, 11 min away, SLA safe with 90th pct
								estimate.
							</p>
						</div>
						<div>
							<p className="text-sm font-medium">Cost breakdown</p>
							<div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
								<span>Travel · 11 min</span>
								<span>SLA lateness · 0</span>
								<span>Overtime · 0</span>
								<span>Imbalance · 1</span>
							</div>
						</div>
						<blockquote className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">
							“{selectedJob.originalMessage}”
						</blockquote>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

export function PlanReviewPage() {
	const approve = useApprovePlan();
	return (
		<div className="mx-auto max-w-[1280px] space-y-6">
			<PageHeader
				title="Plan Review"
				description="Review the smallest safe change before notifications are logged."
				breadcrumbs={["Operate", "Plan Review"]}
				actions={
					<>
						<Button
							variant="outline"
							onClick={() => toast.info("Plan rejected in demo mode.")}
						>
							Reject
						</Button>
						<Button
							onClick={() =>
								approve.mutate(undefined, {
									onSuccess: () =>
										toast.success("Plan approved; demo activity updated."),
								})
							}
							disabled={approve.isPending}
						>
							<Check size={17} /> Approve plan
						</Button>
					</>
				}
			/>
			<div className="rounded-xl border border-status-attention/30 bg-status-attention-soft p-4 text-sm text-status-attention-text">
				<Warning size={17} className="mr-2 inline" /> Hana is late 25 min. The
				proposal protects all tracked SLAs.
			</div>
			<div className="flex flex-wrap gap-2">
				<Badge variant="secondary">1 job moved</Badge>
				<Badge variant="secondary">0 SLA breaches</Badge>
				<Badge variant="secondary">+4 min travel</Badge>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				{["Before", "After"].map((title, after) => (
					<Card key={title}>
						<CardHeader>
							<CardTitle>{title} plan</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{["Hana", "Sara", "Dawit"].map((name, index) => (
								<div key={name}>
									<div className="mb-2 flex justify-between text-sm">
										<span className="font-medium">{name}</span>
										<span className="text-xs text-muted-foreground">
											08:00–17:00
										</span>
									</div>
									<div className="flex gap-2 rounded-lg bg-muted p-2 text-xs">
										<span className="rounded bg-status-scheduled-soft px-2 py-1 text-status-scheduled-text">
											{after && index === 0
												? "JOB-004 · moved"
												: index === 0
													? "JOB-001"
													: index === 1
														? "JOB-003"
														: "JOB-002"}
										</span>
										<span className="rounded bg-status-ok-soft px-2 py-1 text-status-ok-text">
											SLA protected
										</span>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Why this change</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-muted-foreground">
					<p>
						• Hana's lateness is the smallest disruption that preserves the Gold
						response target.
					</p>
					<p>• Preview notifications are logged in dry-run mode.</p>
				</CardContent>
			</Card>
		</div>
	);
}

export function ActivityPage() {
	const { data: approvals, isLoading } = useApprovals();
	const { data: events } = useEvents();
	const approve = useApproveItem();
	if (isLoading || !approvals) return <LoadingCards />;
	return (
		<div className="mx-auto max-w-[1280px] space-y-6">
			<PageHeader
				title="Approvals and Activity"
				description="Keep human decisions, reasoning, and the event trail together."
				breadcrumbs={["Insights", "Approvals and Activity"]}
			/>
			<div className="flex gap-2 border-b border-border pb-2">
				<Button variant="secondary" size="sm">
					Approvals
				</Button>
				<Button variant="ghost" size="sm">
					Activity log
				</Button>
				<Button variant="ghost" size="sm">
					Day replay
				</Button>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				{approvals.map((item) => (
					<Card key={item.id}>
						<CardHeader>
							<div className="flex items-start justify-between gap-3">
								<CardTitle className="text-base">{item.title}</CardTitle>
								<Badge variant="secondary">{item.type}</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">{item.reasoning}</p>
							<div className="mt-4 flex gap-2">
								<Button
									size="sm"
									onClick={() =>
										approve.mutate(item.id, {
											onSuccess: () =>
												toast.success("Approval recorded in demo activity."),
										})
									}
								>
									<Check size={15} /> Approve
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => toast.info("Rejection recorded in demo mode.")}
								>
									Reject
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Recent activity</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{events?.slice(0, 8).map((event) => (
						<div
							key={event.id}
							className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-xs"
						>
							<span className="font-medium">{event.type}</span>
							<span className="text-muted-foreground">{event.reasoning}</span>
							<Badge variant="outline">{event.autonomy}</Badge>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export function ContractsPage() {
	const { data, isLoading } = useContracts();
	const approveContract = useApproveContract();
	const session = authClient.useSession();
	const viewOnly =
		session.data?.user &&
		(session.data.user as { role?: string }).role === "dispatcher";
	if (isLoading || !data) return <LoadingCards />;
	return (
		<div className="mx-auto max-w-[1200px] space-y-6">
			<PageHeader
				title="Contracts and SLA"
				description="Review response commitments, rule status, and evidence readiness."
				breadcrumbs={["Compliance", "Contracts and SLA"]}
				actions={
					<Button
						disabled={viewOnly}
						onClick={() => toast.success("Demo extraction ready for review.")}
					>
						<Plus size={17} /> Upload contract
					</Button>
				}
			/>
			<section className="grid gap-4 md:grid-cols-3">
				<StatCard
					label="SLA met (30 d)"
					value="94%"
					helper="Tracked contract responses"
				/>
				<StatCard
					label="At risk now"
					value="2"
					helper="Jobs approaching deadline"
				/>
				<StatCard
					label="Credit exposure"
					value="3 jobs"
					helper="Requires evidence review"
				/>
			</section>
			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Building</TableHead>
								<TableHead>Tier</TableHead>
								<TableHead>Response</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((contract) => (
								<TableRow key={contract.id}>
									<TableCell className="font-medium">
										{contract.customer}
									</TableCell>
									<TableCell>{contract.tier}</TableCell>
									<TableCell>{contract.responseMinutes / 60}h</TableCell>
									<TableCell>
										<Badge
											variant={
												contract.status === "Active" ? "secondary" : "outline"
											}
										>
											{contract.status}
										</Badge>
										{contract.status !== "Active" && !viewOnly ? <Button size="sm" variant="outline" onClick={() => approveContract.mutate(contract.id)}>Approve</Button> : null}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

export function AssetsPage() {
	const { data: jobs } = useJobs();
	return (
		<div className="mx-auto max-w-[1100px] space-y-6">
			<PageHeader
				title="Assets"
				description="Find repeat failures before they become another missed commitment."
				breadcrumbs={["Compliance", "Assets"]}
				actions={
					<Button
						onClick={() =>
							toast.info(
								"Inspection jobs are created through the approval queue in demo mode.",
							)
						}
					>
						<Wrench size={17} /> Create inspection
					</Button>
				}
			/>
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Lift B-2</CardTitle>
					</CardHeader>
					<CardContent>
						<StatusBadge status="late" />
						<p className="mt-3 text-sm">
							Repeat failures: door sensor, 4 visits in 60 days.
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Recommendation: root-cause inspection.
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Chiller 3</CardTitle>
					</CardHeader>
					<CardContent>
						<StatusBadge status="attention" />
						<p className="mt-3 text-sm">
							1 callback recorded in the current period.
						</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Asset visit history</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						{jobs?.length ?? 24} linked jobs in the demo registry. Select an
						asset to inspect its full event history.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export function SimulatorPage() {
	const { data, isLoading } = useSimulations();
	const runSimulation = useRunSimulation();
	const [scenario, setScenario] = useState<
		"normal" | "heat wave" | "sick leave"
	>("normal");
	const run = data?.find((item) => item.scenario === scenario);
	const session = authClient.useSession();
	const viewOnly =
		(session.data?.user as { role?: string } | undefined)?.role ===
		"dispatcher";
	if (isLoading || !run) return <LoadingCards />;
	return (
		<div className="mx-auto max-w-[1200px] space-y-6">
			<PageHeader
				title="Simulator"
				description="Compare the planner with a nearest-technician baseline before changing capacity."
				breadcrumbs={["Insights", "Simulator"]}
				actions={
					<Button
						disabled={viewOnly}
						onClick={() => runSimulation.mutate({ days: 100, seed: 42, scenario }, { onSuccess: () => toast.success("Simulation complete: seed 42."), onError: (error) => toast.error(error.message) })}
					>
						<Flask size={17} /> Run simulation
					</Button>
				}
			/>
			<div className="flex flex-wrap gap-2">
				{["normal", "heat wave", "sick leave"].map((item) => (
					<Button
						key={item}
						variant={scenario === item ? "secondary" : "outline"}
						size="sm"
						onClick={() => setScenario(item as typeof scenario)}
					>
						{item}
					</Button>
				))}
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Baseline vs planner · {run.scenario}</CardTitle>
					<p className="text-sm text-muted-foreground">100 simulated days</p>
				</CardHeader>
				<CardContent>
					<div className="flex h-52 items-end gap-2 border-b border-border pb-2">
						{Array.from({ length: 20 }, (_, index) => (
							<div key={index} className="flex flex-1 items-end gap-0.5">
								<span
									className="w-1/2 rounded-t bg-muted-foreground/30"
									style={{ height: `${45 + (index % 4) * 5}%` }}
								/>
								<span
									className="w-1/2 rounded-t bg-primary/70"
									style={{ height: `${55 + (index % 5) * 6}%` }}
								/>
							</div>
						))}
					</div>
					<div className="mt-3 flex gap-4 text-xs text-muted-foreground">
						<span>
							<i className="mr-1 inline-block size-2 rounded-full bg-muted-foreground/30" />
							Baseline
						</span>
						<span>
							<i className="mr-1 inline-block size-2 rounded-full bg-primary" />
							Planner
						</span>
					</div>
				</CardContent>
			</Card>
			<div className="grid gap-4 md:grid-cols-3">
				<StatCard
					label="SLA hit rate"
					value={`${run.baselineSla}% → ${run.plannerSla}%`}
					helper="Baseline → planner"
				/>
				<StatCard
					label="Travel minutes"
					value={`${run.baselineTravel} → ${run.plannerTravel}`}
					helper="Across the simulated run"
				/>
				<StatCard
					label="Jobs moved"
					value={String(run.jobsMoved)}
					helper="Planner adjustments"
				/>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>What if we add one elevator technician?</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-semibold">
						Projected SLA compliance 91% → 96%
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Illustrative values, seed 42. Results are simulated and not
						production forecasts.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export function MyJobsPage() {
	const { data: jobs, isLoading } = useJobs();
	const update = useUpdateJobStatus();
	const mine = jobs
		?.filter((job) => job.assignedTechnicianId === "tech-hana")
		.slice(0, 5);
	if (isLoading || !mine) return <LoadingCards />;
	return (
		<div className="mx-auto max-w-[760px] space-y-6">
			<PageHeader
				title="My Jobs"
				description="Today's route, status actions, and the notes you need in the field."
				breadcrumbs={["Operate", "My Jobs"]}
			/>
			<div className="space-y-3">
				{mine.map((job) => (
					<Card key={job.id}>
						<CardContent className="p-5">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<h2 className="font-semibold">{job.title}</h2>
									<p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
										<MapPin size={15} /> {job.address}
									</p>
								</div>
								<StatusBadge
									status={
										statusForBadge(job.status) as
											| "ok"
											| "scheduled"
											| "attention"
											| "late"
									}
								/>
							</div>
							<p className="mt-4 text-sm">
								SLA countdown:{" "}
								<span className="font-semibold">
									due {formatTime(job.slaDueAt)}
								</span>
							</p>
							<p className="mt-2 text-sm text-muted-foreground">{job.notes}</p>
							<div className="mt-4 flex flex-wrap gap-2">
								<Button
									size="sm"
									onClick={() =>
										update.mutate(
											{ jobId: job.id, status: "scheduled" },
											{
												onSuccess: () =>
													toast.success("Status updated in demo activity."),
											},
										)
									}
								>
									<Play size={15} /> On my way
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										update.mutate({ jobId: job.id, status: "late" })
									}
								>
									<Clock size={15} /> Running late
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										update.mutate({ jobId: job.id, status: "done" })
									}
								>
									<CheckCircle size={15} /> Done
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										window.open(
											`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`,
											"_blank",
										)
									}
								>
									<NavigationArrow size={15} /> Navigate
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export function SettingsPage() {
	const { data } = useTechnicians();
	const [autopilot, setAutopilot] = useState(false);
	return (
		<div className="mx-auto max-w-[1200px] space-y-6">
			<PageHeader
				title="Settings"
				description="Manage the roster, autonomy controls, and staff access."
				breadcrumbs={["Manage", "Settings"]}
			/>
			<div className="flex gap-2 border-b border-border pb-2">
				<Button variant="secondary" size="sm">
					Roster and skills
				</Button>
				<Button variant="ghost" size="sm">
					Autonomy
				</Button>
				<Button variant="ghost" size="sm">
					Staff
				</Button>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Roster and skills</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Skills</TableHead>
								<TableHead>Shift</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.map((tech) => (
								<TableRow key={tech.id}>
									<TableCell className="font-medium">{tech.name}</TableCell>
									<TableCell>
										{tech.skills
											.map((skill) => `${skill.name} L${skill.level}`)
											.join(" · ")}
									</TableCell>
									<TableCell>
										{tech.shiftStart}–{tech.shiftEnd}
									</TableCell>
									<TableCell>{tech.status}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Autonomy</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<label className="flex items-center justify-between gap-4">
						<span>
							<span className="font-medium">Auto-pilot</span>
							<span className="block text-muted-foreground">
								Allows approved deterministic re-plans to proceed automatically.
							</span>
						</span>
						<Button
							size="sm"
							variant={autopilot ? "default" : "outline"}
							onClick={() => setAutopilot(!autopilot)}
						>
							{autopilot ? "On" : "Off"}
						</Button>
					</label>
					<label className="flex items-center justify-between gap-4">
						<span>
							<span className="font-medium">Dry-run outbound messages</span>
							<span className="block text-muted-foreground">
								Log notifications without sending them.
							</span>
						</span>
						<Badge variant="secondary">On</Badge>
					</label>
				</CardContent>
			</Card>
		</div>
	);
}
