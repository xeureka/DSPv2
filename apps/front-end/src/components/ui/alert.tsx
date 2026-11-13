import type { HTMLAttributes, ReactNode } from "react";

export function Alert({
	className = "",
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
	return (
		<div
			role="alert"
			className={`rounded-lg border border-status-late/30 bg-status-late-soft p-3 text-sm text-status-late-text ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}
