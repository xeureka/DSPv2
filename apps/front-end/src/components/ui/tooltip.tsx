import type { ReactNode } from "react";

export function Tooltip({
	children,
	label,
}: {
	children: ReactNode;
	label: string;
}) {
	return (
		<span className="group relative inline-flex" title={label}>
			{children}
			<span
				role="tooltip"
				className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg group-hover:block group-focus-within:block"
			>
				{label}
			</span>
		</span>
	);
}
