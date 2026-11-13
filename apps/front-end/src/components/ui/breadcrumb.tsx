import { CaretRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function Breadcrumb({ children }: { children: ReactNode }) {
	return (
		<nav aria-label="Breadcrumb">
			<ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
				{children}
			</ol>
		</nav>
	);
}

export function BreadcrumbItem({
	children,
	current = false,
}: {
	children: ReactNode;
	current?: boolean;
}) {
	return (
		<li className="flex items-center gap-1.5">
			<CaretRight aria-hidden="true" size={13} />
			<span className={current ? "font-medium text-foreground" : ""}>
				{children}
			</span>
		</li>
	);
}
