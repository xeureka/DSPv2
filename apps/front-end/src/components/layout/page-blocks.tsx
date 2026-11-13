import {
	ArrowUpRight,
	CheckCircle,
	Info,
	Plus,
	Warning,
	XCircle,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export function PageHeader({
	title,
	description,
	actions,
	breadcrumbs = ["Overview"],
}: {
	title: string;
	description: string;
	actions?: ReactNode;
	breadcrumbs?: string[];
}) {
	return (
		<div className="space-y-5">
			<Breadcrumb>
				{breadcrumbs.map((crumb, index) => (
					<BreadcrumbItem
						key={crumb}
						current={index === breadcrumbs.length - 1}
					>
						{crumb}
					</BreadcrumbItem>
				))}
			</Breadcrumb>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						{title}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">{description}</p>
				</div>
				{actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
			</div>
		</div>
	);
}

export function FilterBar({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
			{children}
		</div>
	);
}

export function EmptyState({
	icon: Icon = Info,
	title,
	explanation,
	action,
}: {
	icon?: typeof Info;
	title: string;
	explanation: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
			<Icon
				aria-hidden="true"
				size={25}
				weight="duotone"
				className="text-muted-foreground"
			/>
			<p className="font-medium">{title}</p>
			<p className="max-w-sm text-sm text-muted-foreground">{explanation}</p>
			{action}
		</div>
	);
}

export function StatCard({
	label,
	value,
	helper,
	delta,
	loading = false,
	empty = false,
}: {
	label: string;
	value?: string;
	helper: string;
	delta?: string;
	loading?: boolean;
	empty?: boolean;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{label}
				</CardTitle>
				{delta ? (
					<Badge variant="secondary" className="gap-1">
						<ArrowUpRight aria-hidden="true" size={13} />
						{delta}
					</Badge>
				) : null}
			</CardHeader>
			<CardContent>
				{loading ? (
					<>
						<Skeleton className="h-9 w-20" />
						<Skeleton className="mt-2 h-4 w-32" />
					</>
				) : empty ? (
					<>
						<p className="text-2xl font-semibold text-muted-foreground">—</p>
						<p className="mt-1 text-xs text-muted-foreground">{helper}</p>
					</>
				) : (
					<>
						<p className="text-3xl font-semibold tracking-tight">{value}</p>
						<p className="mt-1 text-xs text-muted-foreground">{helper}</p>
					</>
				)}
			</CardContent>
		</Card>
	);
}

const statusMap = {
	ok: {
		label: "OK",
		icon: CheckCircle,
		classes: "bg-status-ok-soft text-status-ok-text",
	},
	scheduled: {
		label: "Scheduled",
		icon: Info,
		classes: "bg-status-scheduled-soft text-status-scheduled-text",
	},
	attention: {
		label: "Needs attention",
		icon: Warning,
		classes: "bg-status-attention-soft text-status-attention-text",
	},
	late: {
		label: "Late or urgent",
		icon: XCircle,
		classes: "bg-status-late-soft text-status-late-text",
	},
} as const;
export function StatusBadge({ status }: { status: keyof typeof statusMap }) {
	const item = statusMap[status];
	const Icon = item.icon;
	return (
		<Badge
			variant="outline"
			className={`gap-1.5 border-transparent ${item.classes}`}
		>
			<Icon aria-hidden="true" size={14} weight="bold" />
			{item.label}
		</Badge>
	);
}

export function EmptyAction({
	children = "Create first item",
}: {
	children?: ReactNode;
}) {
	return (
		<Button size="sm" className="mt-2" disabled>
			<Plus aria-hidden="true" size={16} />
			{children}
		</Button>
	);
}
