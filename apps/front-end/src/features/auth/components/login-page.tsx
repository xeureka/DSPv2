import { Eye, EyeSlash, SpinnerGap, Terminal } from "@phosphor-icons/react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";
import { TypewriterDispatch } from "@/features/auth/components/typewriter-dispatch";
import { DispatchOperationsVisual } from "@/features/auth/components/dispatch-workflow-animation";
import {
	loginSchema,
	passwordInputType,
	signInPayload,
	type LoginFormValues,
} from "@/features/auth/login-model";
import type { SystemStatusState } from "@/features/auth/system-status";

const statusCopy: Record<
	SystemStatusState,
	{ label: string; className: string }
> = {
	loading: { label: "CHECKING", className: "text-white/60" },
	operational: { label: "OPERATIONAL", className: "text-status-ok" },
	degraded: { label: "DEGRADED", className: "text-status-attention" },
	unreachable: { label: "UNREACHABLE", className: "text-status-late" },
};

const demoCredentials = [
	{ role: "Manager", email: "manager@dispatchpilot.local", password: "DispatchPilotManager123!" },
	{ role: "Dispatcher", email: "dispatcher@dispatchpilot.local", password: "DispatchPilotDispatcher123!" },
	{ role: "Technician", email: "technician@dispatchpilot.local", password: "DispatchPilotTechnician123!" },
] as const;

const showDemoCredentials =
	import.meta.env.DEV &&
	(import.meta.env.VITE_SHOW_DEMO_CREDENTIALS as string | undefined) !== "false";

function StatusReadout({ status }: { status: SystemStatusState }) {
	const copy = statusCopy[status];
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-white/55">SYSTEM_STATUS</span>
			<span className={`flex items-center gap-2 ${copy.className}`}>
				<span className="size-2 rounded-full bg-current" aria-hidden="true" />
				{copy.label}
			</span>
		</div>
	);
}

function DispatchArt() {
	return (
		<svg
			viewBox="0 0 620 340"
			className="login-dispatch-art absolute inset-0 h-full w-full"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient id="glass-teal" x1="0" x2="1">
					<stop stopColor="#2dd4bf" stopOpacity=".34" />
					<stop offset="1" stopColor="#0d9488" stopOpacity=".08" />
				</linearGradient>
				<linearGradient id="glass-blue" x1="0" x2="1">
					<stop stopColor="#60a5fa" stopOpacity=".32" />
					<stop offset="1" stopColor="#2563eb" stopOpacity=".08" />
				</linearGradient>
				<linearGradient id="glass-amber" x1="0" x2="1">
					<stop stopColor="#fbbf24" stopOpacity=".34" />
					<stop offset="1" stopColor="#d97706" stopOpacity=".08" />
				</linearGradient>
				<linearGradient id="glass-red" x1="0" x2="1">
					<stop stopColor="#f87171" stopOpacity=".3" />
					<stop offset="1" stopColor="#dc2626" stopOpacity=".08" />
				</linearGradient>
				<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
					<circle cx="1" cy="1" r="1" fill="#dcfce7" fillOpacity=".15" />
				</pattern>
			</defs>
			<rect width="620" height="340" fill="url(#dots)" />
			<g fill="none" stroke="#dcfce7" strokeOpacity=".1">
				<path d="M42 92h536M42 170h536M42 248h536" />
			</g>
			<g
				className="login-glass-tile"
				fill="url(#glass-teal)"
				stroke="#b7fff5"
				strokeOpacity=".24"
			>
				<rect x="72" y="67" width="142" height="43" rx="8" />
			</g>
			<g
				className="login-glass-tile"
				fill="url(#glass-blue)"
				stroke="#c6dcff"
				strokeOpacity=".22"
			>
				<rect x="264" y="145" width="178" height="43" rx="8" />
			</g>
			<g
				className="login-glass-tile login-glass-tile--drift"
				fill="url(#glass-red)"
				stroke="#ffd0d0"
				strokeOpacity=".24"
			>
				<rect x="110" y="223" width="142" height="43" rx="8" />
			</g>
			<g
				className="login-glass-tile"
				fill="url(#glass-amber)"
				stroke="#ffe8ad"
				strokeOpacity=".24"
			>
				<rect x="456" y="67" width="96" height="43" rx="8" />
			</g>
			<g fill="#e8f5ec" fillOpacity=".55" fontFamily="monospace" fontSize="10">
				<text x="88" y="93">
					OWNER ASSIGNED
				</text>
				<text x="280" y="171">
					SLA TIMER RUNNING
				</text>
				<text x="126" y="249">
					RE-PLAN
				</text>
				<text x="472" y="93">
					QUEUE
				</text>
			</g>
		</svg>
	);
}

export function BrandPanel({ status }: { status: SystemStatusState }) {
	return (
		<section className="login-brand-panel relative min-h-[260px] overflow-hidden border-b border-white/10 px-5 py-6 text-white sm:px-8 lg:min-h-[100svh] lg:border-b-0 lg:border-r lg:px-10 lg:py-10 xl:px-16">
			<DispatchArt />
			<div className="relative z-10 mx-auto flex h-full max-w-[560px] flex-col justify-center">
				<div className="login-glass-card login-entrance rounded-xl p-5 backdrop-blur-md sm:p-7 lg:p-8">
					<p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-white/65">
						<Terminal size={14} aria-hidden="true" />
						DISPATCHPILOT
					</p>
					<h1 className="mt-6 max-w-[480px] text-3xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-4xl xl:text-5xl">
						Every request gets an owner, a timer, and an escalation path.
					</h1>
					<p className="mt-5 max-w-[420px] text-sm leading-6 text-white/65 sm:text-base">
						Plan the day, protect service commitments, and prove every response.
					</p>
					<div className="mt-8 space-y-3 border-t border-white/15 pt-5 font-mono text-[10px] tracking-[0.12em] sm:text-[11px]">
						<StatusReadout status={status} />
						<div className="hidden items-center justify-between gap-4 text-white/65 sm:flex">
							<span>ESCALATION</span>
							<span className="text-right text-white/85">
								TECHNICIAN → DISPATCHER → MANAGER
							</span>
						</div>
						<div className="hidden items-center justify-between gap-4 text-white/65 sm:flex">
							<span>AUDIT_TRAIL</span>
							<span className="text-right text-white/85">
								EVERY DECISION LOGGED
							</span>
						</div>
					</div>
					<TypewriterDispatch />
				</div>
			</div>
		</section>
	);
}

export function LoginPage() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		mode: "onBlur",
		defaultValues: { rememberMe: true },
	});

	if (session?.user) return <Navigate to="/" replace />;

	const onSubmit = async (values: LoginFormValues) => {
		if (submitting) return;
		setApiError(null);
		setSubmitting(true);
		try {
			const result = await authClient.signIn.email(signInPayload(values));
			if (result.error) {
				setApiError(
					"Unable to sign in. Check your email and password and try again.",
				);
				return;
			}
			setSuccess(true);
			await new Promise((resolve) => window.setTimeout(resolve, 350));
			navigate({ to: "/", replace: true });
		} catch {
			setApiError(
				"Unable to sign in. Check your email and password and try again.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const signInWithGoogle = async () => {
		setApiError(null);
		const result = await authClient.signIn.social({
			provider: "google",
			callbackURL: window.location.origin,
		});
		if (result.error) {
			setApiError(
				"Unable to sign in with Google. Use an existing staff account.",
			);
		}
	};

	return (
		<main className="login-page grid min-h-[100svh] bg-background text-foreground md:grid-cols-[52fr_48fr] lg:grid-cols-[58fr_42fr]">
			<section className="dispatch-operations-panel hidden min-h-[100svh] items-center justify-center border-r border-border px-5 py-10 md:flex lg:px-8 xl:px-16">
				<DispatchOperationsVisual />
			</section>
			<section className="login-form-panel flex min-h-[100svh] w-full items-center justify-center px-5 py-10 sm:px-8">
				<div className="w-full max-w-[400px]">
					<div
						className="mb-9 flex items-center gap-3"
						aria-label="DispatchPilot"
					>
						<span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
							D
						</span>
						<span className="text-[15px] font-semibold tracking-[-0.02em]">
							DispatchPilot
						</span>
					</div>

					<div className="mb-8">
						<h1 className="text-[30px] font-semibold leading-tight tracking-[-0.035em]">
							Welcome back
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Sign in to your DispatchPilot workspace.
						</p>
					</div>

					{apiError ? (
						<Alert role="alert" className="mb-6 text-sm">
							{apiError}
						</Alert>
					) : null}

					<form
						className="space-y-5"
						onSubmit={handleSubmit(onSubmit)}
						noValidate
					>
						<div className="space-y-2">
							<Label htmlFor="email" className="text-sm font-medium">
								Email address
							</Label>
							<Input
								id="email"
								type="email"
								inputMode="email"
								autoFocus
								autoComplete="email"
								aria-invalid={!!errors.email}
								aria-describedby={errors.email ? "email-error" : undefined}
								className="h-11 !rounded-md bg-surface px-3 text-sm"
								{...register("email")}
							/>
							{errors.email ? (
								<p id="email-error" className="text-sm text-destructive">
									{errors.email.message}
								</p>
							) : null}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between gap-4">
								<Label htmlFor="password" className="text-sm font-medium">
									Password
								</Label>
								<Link
									to="/forgot-password"
									className="text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									Forgot password?
								</Link>
							</div>
							<div className="relative">
								<Input
									id="password"
									type={passwordInputType(showPassword)}
									autoComplete="current-password"
									aria-invalid={!!errors.password}
									aria-describedby={
										errors.password ? "password-error" : undefined
									}
									className="h-11 !rounded-md bg-surface px-3 pr-11 text-sm"
									{...register("password")}
								/>
								<button
									type="button"
									aria-label={showPassword ? "Hide password" : "Show password"}
									aria-pressed={showPassword}
									className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onMouseDown={(event) => event.preventDefault()}
									onClick={() => setShowPassword((value) => !value)}
								>
									{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
								</button>
							</div>
							{errors.password ? (
								<p id="password-error" className="text-sm text-destructive">
									{errors.password.message}
								</p>
							) : null}
						</div>

						<Button
							type="submit"
							className="h-11 w-full !rounded-md text-sm font-medium hover:bg-primary-hover"
							disabled={submitting || success}
						>
							{submitting ? (
								<>
									<SpinnerGap className="animate-spin" size={17} /> Signing in…
								</>
							) : success ? (
								"Signed in"
							) : (
								"Sign in"
							)}
						</Button>
					</form>

				{showDemoCredentials ? (
					<aside className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" aria-label="Development demo credentials">
						<p className="font-semibold">Development demo accounts</p>
						<p className="mt-1 text-amber-900/80">Visible only in Vite development mode. Do not use these accounts in production.</p>
						<div className="mt-3 space-y-2 font-mono">
							{demoCredentials.map((credential) => (
								<div key={credential.role} className="rounded border border-amber-200 bg-white/70 p-2">
									<p className="font-sans font-semibold">{credential.role}</p>
									<p>{credential.email}</p>
									<p>{credential.password}</p>
								</div>
							))}
						</div>
					</aside>
				) : null}

					<div className="my-7 flex items-center gap-3 text-xs text-muted-foreground">
						<span className="h-px flex-1 bg-border" />
						<span>or</span>
						<span className="h-px flex-1 bg-border" />
					</div>

					<Button
						variant="outline"
						className="h-11 w-full !rounded-md bg-surface text-sm font-medium text-foreground hover:bg-muted"
						disabled={submitting}
						onClick={() => void signInWithGoogle()}
					>
						<svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
							<path
								fill="#4285F4"
								d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z"
							/>
							<path
								fill="#34A853"
								d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5Z"
							/>
							<path
								fill="#FBBC05"
								d="M6.54 13.6A5.85 5.85 0 0 1 6.23 12c0-.56.11-1.1.31-1.6V7.88H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.12l3.24-2.52Z"
							/>
							<path
								fill="#EA4335"
								d="M12 6.38c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.52C7.31 8.1 9.46 6.38 12 6.38Z"
							/>
						</svg>
						Sign in with Google
					</Button>
				</div>
			</section>
		</main>
	);
}
