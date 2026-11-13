import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function Sheet({
	open,
	onOpenChange,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 md:hidden">
			<button
				aria-label="Close navigation"
				className="absolute inset-0 bg-foreground/40"
				onClick={() => onOpenChange(false)}
			/>
			<div className="relative h-full w-[min(19rem,85vw)] bg-sidebar p-4 shadow-xl">
				<button
					aria-label="Close navigation"
					className="absolute right-3 top-3 rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
					onClick={() => onOpenChange(false)}
				>
					<X size={18} />
				</button>
				{children}
			</div>
		</div>
	);
}
