import {
	ArrowRight,
	Circle,
	EnvelopeSimple,
	Eye,
	EyeSlash,
	LockKey,
	Moon,
	SpinnerGap,
	Sun,
	Terminal,
} from "@phosphor-icons/react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
	loginSchema,
	passwordInputType,
	signInPayload,
	type LoginFormValues,
} from "@/features/auth/login-model";
import {
	fetchSystemStatus,
	type SystemStatusState,
} from "@/features/auth/system-status";

const statusCopy: Record<SystemStatusState, { label: string; className: string }> = {
	loading: { label: "CHECKING", className: "text-white/60" },
	operational: { label: "OPERATIONAL", className: "text-status-ok" },
	degraded: { label: "DEGRADED", className: "text-status-attention" },
	unreachable: { label: "UNREACHABLE", className: "text-status-late" },
};

function StatusReadout({ status }: { status: SystemStatusState }) {
	const copy = statusCopy[status];
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-white/55">SYSTEM_STATUS</span>
			<span className={`flex items-center gap-2 ${copy.className}`}>
				<Circle weight="fill" size={8} aria-hidden="true" />
				{copy.label}
			</span>
		</div>
	);
}

function DispatchArt() {
	return (
		<svg viewBox="0 0 620 340" className="login-dispatch-art absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
			<defs>
				<linearGradient id="glass-teal" x1="0" x2="1"><stop stopColor="#2dd4bf" stopOpacity=".34" /><stop offset="1" stopColor="#0d9488" stopOpacity=".08" /></linearGradient>
				<linearGradient id="glass-blue" x1="0" x2="1"><stop stopColor="#60a5fa" stopOpacity=".32" /><stop offset="1" stopColor="#2563eb" stopOpacity=".08" /></linearGradient>
				<linearGradient id="glass-amber" x1="0" x2="1"><stop stopColor="#fbbf24" stopOpacity=".34" /><stop offset="1" stopColor="#d97706" stopOpacity=".08" /></linearGradient>
				<linearGradient id="glass-red" x1="0" x2="1"><stop stopColor="#f87171" stopOpacity=".3" /><stop offset="1" stopColor="#dc2626" stopOpacity=".08" /></linearGradient>
				<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dde3ff" fillOpacity=".15" /></pattern>
			</defs>
			<rect width="620" height="340" fill="url(#dots)" />
			<g fill="none" stroke="#dde3ff" strokeOpacity=".1"><path d="M42 92h536M42 170h536M42 248h536" /></g>
			<g className="login-glass-tile" fill="url(#glass-teal)" stroke="#b7fff5" strokeOpacity=".24"><rect x="72" y="67" width="142" height="43" rx="8" /></g>
			<g className="login-glass-tile" fill="url(#glass-blue)" stroke="#c6dcff" strokeOpacity=".22"><rect x="264" y="145" width="178" height="43" rx="8" /></g>
			<g className="login-glass-tile login-glass-tile--drift" fill="url(#glass-red)" stroke="#ffd0d0" strokeOpacity=".24"><rect x="110" y="223" width="142" height="43" rx="8" /></g>
			<g className="login-glass-tile" fill="url(#glass-amber)" stroke="#ffe8ad" strokeOpacity=".24"><rect x="456" y="67" width="96" height="43" rx="8" /></g>
			<g fill="#e6eaf2" fillOpacity=".55" fontFamily="monospace" fontSize="10">
				<text x="88" y="93">OWNER ASSIGNED</text><text x="280" y="171">SLA TIMER RUNNING</text><text x="126" y="249">RE-PLAN</text><text x="472" y="93">QUEUE</text>
			</g>
		</svg>
	);
}

function BrandPanel({ status }: { status: SystemStatusState }) {
	return (
		<section className="login-brand-panel relative min-h-[260px] overflow-hidden border-b border-white/10 px-5 py-6 text-white sm:px-8 lg:min-h-[100svh] lg:border-b-0 lg:border-r lg:px-10 lg:py-10 xl:px-16">
			<DispatchArt />
			<div className="relative z-10 mx-auto flex h-full max-w-[560px] flex-col justify-center">
				<div className="login-glass-card login-entrance rounded-xl p-5 backdrop-blur-md sm:p-7 lg:p-8">
					<p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-white/65"><Terminal size={14} aria-hidden="true" />DISPATCHPILOT</p>
					<h1 className="mt-6 max-w-[480px] text-3xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-4xl xl:text-5xl">Every request gets an owner, a timer, and an escalation path.</h1>
					<p className="mt-5 max-w-[420px] text-sm leading-6 text-white/65 sm:text-base">Plan the day, protect service commitments, and prove every response.</p>
					<div className="mt-8 space-y-3 border-t border-white/15 pt-5 font-mono text-[10px] tracking-[0.12em] sm:text-[11px]">
						<StatusReadout status={status} />
						<div className="hidden items-center justify-between gap-4 text-white/65 sm:flex"><span>ESCALATION</span><span className="text-right text-white/85">TECHNICIAN → DISPATCHER → MANAGER</span></div>
						<div className="hidden items-center justify-between gap-4 text-white/65 sm:flex"><span>AUDIT_TRAIL</span><span className="text-right text-white/85">EVERY DECISION LOGGED</span></div>
					</div>
				</div>
			</div>
		</section>
	);
}

export function LoginPage() {
	const navigate = useNavigate();
	const { resolvedTheme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);
	const [systemStatus, setSystemStatus] = useState<SystemStatusState>("loading");
	const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), mode: "onBlur", defaultValues: { rememberMe: true } });

	useEffect(() => {
		let cancelled = false;
		const checkStatus = async () => {
			const nextStatus = await fetchSystemStatus(() => api.get<{ status: string }>("/ready"));
			if (!cancelled) setSystemStatus(nextStatus);
		};
		void checkStatus();
		const interval = window.setInterval(() => { if (document.visibilityState === "visible") void checkStatus(); }, 60_000);
		const handleVisibility = () => { if (document.visibilityState === "visible") void checkStatus(); };
		document.addEventListener("visibilitychange", handleVisibility);
		return () => { cancelled = true; window.clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibility); };
	}, []);

	if (session?.user) return <Navigate to="/" replace />;

	const onSubmit = async (values: LoginFormValues) => {
		if (submitting) return;
		setApiError(null);
		setSubmitting(true);
		try {
			const result = await authClient.signIn.email(signInPayload(values));
			if (result.error) { setApiError("Unable to sign in. Check your email and password and try again."); return; }
			setSuccess(true);
			await new Promise((resolve) => window.setTimeout(resolve, 350));
			navigate({ to: "/", replace: true });
		} catch { setApiError("Unable to sign in. Check your email and password and try again."); } finally { setSubmitting(false); }
	};

	return (
		<main className="grid min-h-[100svh] overflow-x-hidden bg-background lg:grid-cols-2">
			<BrandPanel status={systemStatus} />
			<section className="relative flex min-h-[calc(100svh-260px)] flex-col px-5 py-5 sm:px-8 lg:min-h-[100svh] lg:px-12 lg:py-8 xl:px-20">
				<div className="flex justify-end"><Button variant="ghost" size="icon" aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</Button></div>
				<div className="flex flex-1 items-center justify-center py-8 sm:py-12">
					<div className="w-full max-w-[450px] login-entrance">
						<div className="mb-7"><h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">SIGN IN</h2><p className="mt-3 max-w-[390px] font-mono text-[10px] leading-5 tracking-[0.14em] text-muted-foreground sm:text-[11px]">ENTER YOUR CREDENTIALS TO ACCESS THE DISPATCH CONSOLE.</p></div>
						<Card className={`rounded-md border-border bg-card shadow-none ${apiError ? "login-card-shake" : ""}`}><CardContent className="p-5 sm:p-7">
							{apiError ? <Alert className="mb-6">{apiError}</Alert> : null}
							<form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
								<div className="space-y-2"><Label htmlFor="email" className="font-mono text-[10px] tracking-[0.16em]">EMAIL ADDRESS</Label><div className="relative"><EnvelopeSimple aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" inputMode="email" autoFocus autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} className="min-h-11 rounded-sm pl-10 font-mono text-sm" {...register("email")} /></div>{errors.email ? <p id="email-error" className="font-mono text-xs text-destructive">{errors.email.message}</p> : null}</div>
								<div className="space-y-2"><Label htmlFor="password" className="font-mono text-[10px] tracking-[0.16em]">PASSWORD</Label><div className="relative"><LockKey aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input id="password" type={passwordInputType(showPassword)} autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} className="min-h-11 rounded-sm px-10 font-mono text-sm" {...register("password")} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onMouseDown={(event) => event.preventDefault()} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}</button></div>{errors.password ? <p id="password-error" className="font-mono text-xs text-destructive">{errors.password.message}</p> : null}</div>
								<label className="flex min-h-11 cursor-pointer items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground"><Checkbox {...register("rememberMe")} />REMEMBER ME</label>
								<Button type="submit" className="min-h-11 w-full rounded-sm font-mono text-xs tracking-[0.14em]" disabled={submitting || success}>{submitting ? <><SpinnerGap className="animate-spin" size={17} /> SIGNING IN...</> : success ? "ACCESS GRANTED" : <>ACCESS CONSOLE <ArrowRight size={17} /></>}</Button>
							</form>
							<p className="mt-6 border-t border-border pt-5 text-center font-mono text-[10px] tracking-[0.12em] text-muted-foreground">NEED AN ACCOUNT? ASK YOUR MANAGER.</p>
						</CardContent></Card>
					</div>
				</div>
				<p className="text-center font-mono text-[10px] tracking-[0.1em] text-muted-foreground">DISPATCHPILOT · 2026</p>
			</section>
		</main>
	);
}
