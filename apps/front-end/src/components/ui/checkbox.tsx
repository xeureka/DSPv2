import { Check } from "@phosphor-icons/react";
import type { InputHTMLAttributes } from "react";

export function Checkbox({
	className = "",
	...props
}: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<span className="relative inline-flex size-5 shrink-0">
			<input
				type="checkbox"
				className={`peer size-5 appearance-none rounded border border-input bg-background transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
				{...props}
			/>
			<Check
				aria-hidden="true"
				weight="bold"
				className="pointer-events-none absolute inset-0 m-auto hidden size-3.5 text-primary-foreground peer-checked:block"
			/>
		</span>
	);
}
