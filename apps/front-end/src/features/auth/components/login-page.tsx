import {
	ArrowRight,
	Compass,
	EnvelopeSimple,
	Eye,
	EyeSlash,
	LockKey,
	Moon,
	SpinnerGap,
	Sun,
} from "@phosphor-icons/react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
	loginSchema,
	passwordInputType,
	signInPayload,
	type LoginFormValues,
} from "@/features/auth/login-model";

function TimelineIllustration() {
	return (
		<svg
			viewBox="0 0 620 320"
			role="img"
			aria-label="Illustration of a dispatch timeline with a calm re-plan animation"
			aria-hidden="true"
			className="w-full max-w-[620px]"
		>
			<defs>
				<linearGradient id="timeline-surface" x1="0" x2="1">
					<stop offset="0" stopColor="#27376f" />
					<stop offset="1" stopColor="#1e2b57" />
				</linearGradient>
				<filter id="timeline-shadow">
					<feGaussianBlur stdDeviation="10" />
				</filter>
			</defs>
			<rect width="620" height="320" rx="24" fill="url(#timeline-surface)" />
			<g opacity=".16" stroke="#dde3ff">
				<path d="M32 72h556M32 144h556M32 216h556M120 32v256M250 32v256M380 32v256M510 32v256" />
			</g>
			<g fill="#94a0b8" fontFamily="sans-serif" fontSize="13">
				<text x="32" y="52">
					09:00
				</text>
				<text x="162" y="52">
					11:00
				</text>
				<text x="292" y="52">
					13:00
				</text>
				<text x="422" y="52">
					15:00
				</text>
				<text x="552" y="52">
					17:00
				</text>
				<text x="32" y="104">
					A
				</text>
				<text x="32" y="176">
					B
				</text>
				<text x="32" y="248">
					C
				</text>
			</g>
			<g transform="translate(66 80)">
				<rect width="125" height="40" rx="9" fill="#d9f5f0" />
				<text x="14" y="25" fill="#0b5f57" fontSize="13">
					Completed
				</text>
				<rect x="150" width="104" height="40" rx="9" fill="#e0eaff" />
				<text x="164" y="25" fill="#1d3f9c" fontSize="13">
					Scheduled
				</text>
			</g>
			<g transform="translate(66 152)">
				<rect width="110" height="40" rx="9" fill="#fdebc8" />
				<text x="14" y="25" fill="#8a4b05" fontSize="13">
					Attention
				</text>
				<rect
					x="188"
					width="128"
					height="40"
					rx="9"
					fill="#fbdcdc"
					className="timeline-late"
				/>
				<text x="202" y="25" fill="#8e1b1b" fontSize="13">
					Running late
				</text>
			</g>
			<g transform="translate(66 224)">
				<rect width="118" height="40" rx="9" fill="#e0eaff" />
				<text x="14" y="25" fill="#1d3f9c" fontSize="13">
					Scheduled
				</text>
				<rect x="220" width="130" height="40" rx="9" fill="#d9f5f0" />
				<text x="234" y="25" fill="#0b5f57" fontSize="13">
					On track
				</text>
			</g>
			<g transform="translate(520 82)">
				<circle
					r="34"
					fill="none"
					stroke="#0b1020"
					strokeOpacity=".28"
					strokeWidth="7"
				/>
				<circle
					r="34"
					fill="none"
					stroke="#7c86f2"
					strokeWidth="7"
					strokeDasharray="150 214"
					strokeLinecap="round"
					className="timeline-ring"
				/>
				<text x="-18" y="5" fill="#e6eaf2" fontSize="13">
					SLA
				</text>
			</g>
			<rect
				x="414"
				y="270"
				width="148"
				height="24"
				rx="12"
				fill="#0b1020"
				fillOpacity=".3"
			/>
			<text x="432" y="286" fill="#cdd5ff" fontSize="11">
				re-plan preview
			</text>
		</svg>
	);
}

export function LoginPage() {
	const navigate = useNavigate();
	const { theme, setTheme } = useTheme();
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

	return (
		<main className="grid min-h-[100svh] overflow-hidden bg-background lg:grid-cols-[45%_55%]">
			<section className="relative flex min-h-[100svh] flex-col px-5 py-5 sm:px-8 lg:px-12">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
						<span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<Compass size={19} weight="duotone" />
						</span>
						DispatchPilot
					</div>
					<Button
						variant="ghost"
						size="icon"
						aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					>
						{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
					</Button>
				</div>
				<div className="flex flex-1 items-center justify-center py-12">
					<Card
						className={`w-full max-w-[400px] border-border bg-card shadow-none login-card-enter ${apiError ? "login-card-shake" : ""}`}
					>
						<CardContent className="p-6 sm:p-8">
							<div className="mb-7">
								<p className="text-sm font-medium text-accent">
									Dispatch workspace
								</p>
								<h1 className="mt-2 text-3xl font-semibold tracking-tight">
									Welcome back
								</h1>
								<p className="mt-2 text-sm text-muted-foreground">
									Sign in to your dispatch workspace
								</p>
							</div>
							{apiError ? <Alert className="mb-5">{apiError}</Alert> : null}
							<form
								className="space-y-5"
								onSubmit={handleSubmit(onSubmit)}
								noValidate
							>
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<div className="relative">
										<EnvelopeSimple
											aria-hidden="true"
											size={18}
											className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="email"
											type="email"
											inputMode="email"
											autoFocus
											autoComplete="email"
											aria-invalid={!!errors.email}
											aria-describedby={
												errors.email ? "email-error" : undefined
											}
											className="min-h-11 pl-10"
											{...register("email")}
										/>
									</div>
									{errors.email ? (
										<p id="email-error" className="text-sm text-destructive">
											{errors.email.message}
										</p>
									) : null}
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<div className="relative">
										<LockKey
											aria-hidden="true"
											size={18}
											className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="password"
											type={passwordInputType(showPassword)}
											autoComplete="current-password"
											aria-invalid={!!errors.password}
											aria-describedby={
												errors.password ? "password-error" : undefined
											}
											className="min-h-11 px-10"
											{...register("password")}
										/>
										<button
											type="button"
											aria-label={
												showPassword ? "Hide password" : "Show password"
											}
											aria-pressed={showPassword}
											className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => setShowPassword((value) => !value)}
										>
											{showPassword ? (
												<EyeSlash size={18} />
											) : (
												<Eye size={18} />
											)}
										</button>
									</div>
									{errors.password ? (
										<p id="password-error" className="text-sm text-destructive">
											{errors.password.message}
										</p>
									) : null}
								</div>
								<label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
									<Checkbox {...register("rememberMe")} />
									Remember me
								</label>
								<Button
									type="submit"
									className="min-h-11 w-full"
									disabled={submitting || success}
								>
									{submitting ? (
										<>
											<SpinnerGap className="animate-spin" size={18} />
											Signing in…
										</>
									) : success ? (
										"Signed in"
									) : (
										<>
											Sign in
											<ArrowRight size={18} />
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
				<p className="text-center text-xs text-muted-foreground">
					DispatchPilot · 2026
				</p>
			</section>
			<aside className="relative hidden overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-center xl:px-20">
				<div className="brand-grid absolute inset-0 opacity-30" />
				<div className="relative z-10 mx-auto max-w-2xl login-panel-enter">
					<p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
						DispatchPilot
					</p>
					<h2 className="mt-6 max-w-xl text-4xl font-semibold leading-tight xl:text-5xl">
						Every request gets an owner, a timer, and an escalation path.
					</h2>
					<p className="mt-6 max-w-lg text-base leading-7 text-primary-foreground/75">
						Plan the day with clarity, protect service commitments, and keep
						every response accountable.
					</p>
					<div className="mt-14 rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 backdrop-blur-sm">
						<TimelineIllustration />
					</div>
				</div>
			</aside>
			<div className="absolute inset-x-0 top-0 -z-0 h-36 bg-primary lg:hidden">
				<div className="brand-grid absolute inset-0 opacity-30" />
				<div className="relative px-5 py-5 text-primary-foreground">
					<p className="text-sm font-medium">DispatchPilot</p>
					<h2 className="mt-3 max-w-sm text-xl font-semibold leading-tight">
						Every request gets an owner, a timer, and an escalation path.
					</h2>
				</div>
			</div>
		</main>
	);
}
