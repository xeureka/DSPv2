import type { HTMLAttributes } from "react";

export function Avatar({
	className = "",
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ${className}`}
			{...props}
		/>
	);
}
