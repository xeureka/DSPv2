import { useEffect, useState } from "react";
import {
	dispatchLines,
	typewriterFrame,
} from "@/features/auth/typewriter-dispatch-model";

const keys = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

export function TypewriterDispatch() {
	const [lineIndex, setLineIndex] = useState(0);
	const [visible, setVisible] = useState(0);
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setReduced(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	useEffect(() => {
		if (reduced) return;
		const line = dispatchLines[lineIndex];
		if (visible < line.length) {
			const timer = window.setTimeout(
				() => setVisible((value) => value + 1),
				58,
			);
			return () => window.clearTimeout(timer);
		}
		const timer = window.setTimeout(() => {
			setLineIndex((value) => (value + 1) % dispatchLines.length);
			setVisible(0);
		}, 1500);
		return () => window.clearTimeout(timer);
	}, [lineIndex, reduced, visible]);

	const currentLine = dispatchLines[lineIndex];
	const frame = typewriterFrame(currentLine, visible, reduced);
	const display = frame.text;
	const typedCharacter = display.at(-1)?.toUpperCase();

	return (
		<div
			className="typewriter-dispatch mt-7 border-t border-white/15 pt-5 font-mono"
			aria-hidden="true"
		>
			<div className="flex items-center justify-between gap-3 text-[9px] tracking-[0.16em] text-white/55">
				<span>DISPATCH_FEED</span>
				<span>
					line {lineIndex + 1} · col {display.length + 1}
				</span>
			</div>
			<div className="mt-2 min-h-6 text-[11px] tracking-[0.08em] text-emerald-100">
				<span className="text-emerald-300">›</span> {display}
				<span className="ml-0.5 inline-block h-3 w-px bg-emerald-300 align-middle" />
			</div>
			<div className="mt-3 flex gap-1 overflow-hidden opacity-75">
				{keys.map((key) => (
					<span
						key={key}
						className={`flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-white/20 text-[8px] text-white/70 ${key === typedCharacter ? "typewriter-key-active" : "bg-white/5"}`}
					>
						{key}
					</span>
				))}
			</div>
			<div className="mt-4 hidden grid-cols-5 gap-1.5 sm:grid">
				{["INTAKE", "TRIAGE", "ASSIGN", "NOTIFY", "SLA TIMER"].map(
					(station, index) => (
						<div key={station} className="relative text-center">
							<div className="h-1 rounded-full bg-emerald-100/15">
								<div
									className={`h-full rounded-full bg-emerald-300 transition-[width] duration-500 ${Math.min(
										100,
										Math.max(
											18,
											((visible + index * 5) /
												Math.max(1, currentLine.length)) *
												100,
										),
									)}%`}
								/>
							</div>
							<p className="mt-1 truncate text-[7px] tracking-[0.1em] text-white/45">
								{station}
							</p>
						</div>
					),
				)}
			</div>
		</div>
	);
}
