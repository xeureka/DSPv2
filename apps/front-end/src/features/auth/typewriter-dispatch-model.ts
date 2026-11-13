export const dispatchLines = [
	"JOB-014 received",
	"triage: elevator · safety",
	"assigned → Hana",
	"SLA timer started",
	"re-plan: 1 job moved",
	"escalated → dispatcher",
] as const;

export function typewriterFrame(
	line: string,
	visibleCharacters: number,
	reducedMotion: boolean,
) {
	const visible = reducedMotion ? line : line.slice(0, visibleCharacters);
	return { text: visible, line, column: visible.length + 1 };
}
