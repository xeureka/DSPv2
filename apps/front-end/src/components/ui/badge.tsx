import { cn } from "../../lib/utils.ts";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, { chip: string; dot: string }> = {
	neutral: { chip: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400" },
	accent: { chip: "border-primary-200 bg-primary-50 text-primary-700", dot: "bg-primary-500" },
	success: { chip: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
	warning: { chip: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
	danger: { chip: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-500" },
};

export function Badge({
	tone = "neutral",
	children,
	className,
}: {
	tone?: BadgeTone;
	children: React.ReactNode;
	className?: string;
}) {
	const palette = badgeTones[tone];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
				palette.chip,
				className,
			)}
		>
			<span className={cn("size-1.5 rounded-full", palette.dot)} aria-hidden />
			{children}
		</span>
	);
}
