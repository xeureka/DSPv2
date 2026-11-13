import {
	ArrowLeft,
	CheckCircle,
	Eye,
	EyeSlash,
	EnvelopeSimple,
	LockKey,
	Moon,
	SpinnerGap,
	Sun,
} from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
	forgotPasswordSchema,
	passwordStrength,
	resetPasswordSchema,
} from "@/features/auth/password-reset-model";
import { BrandPanel } from "@/features/auth/components/login-page";

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label="Toggle theme"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
		>
			{resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
		</Button>
	);
}

function AuthFrame({
	children,
	title,
	subtitle,
}: {
	children: React.ReactNode;
	title: string;
	subtitle: string;
}) {
	return (
		<main className="grid min-h-[100svh] overflow-x-hidden bg-background lg:grid-cols-2">
			<BrandPanel status="operational" />
			<section className="relative flex min-h-[calc(100svh-260px)] flex-col px-5 py-5 sm:px-8 lg:min-h-[100svh] lg:px-12 lg:py-8 xl:px-20">
				<div className="flex justify-end">
					<ThemeToggle />
				</div>
				<div className="flex flex-1 items-center justify-center py-8">
					<div className="w-full max-w-[450px] login-entrance">
						<div className="mb-7">
							<h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
								{title}
							</h1>
							<p className="mt-3 font-mono text-[10px] leading-5 tracking-[0.14em] text-muted-foreground sm:text-[11px]">
								{subtitle}
							</p>
						</div>
						{children}
						<p className="mt-6 text-center font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
							DISPATCHPILOT · 2026
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}

export function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<{ email: string }>({
		resolver: zodResolver(forgotPasswordSchema),
		mode: "onBlur",
	});
	const onSubmit = async ({ email }: { email: string }) => {
		setError(null);
		try {
			const result = await authClient.requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/reset-password`,
			});
			if (result.error) throw new Error("request failed");
		} catch {
			/* Keep the response generic to prevent account enumeration. */
		}
		setSent(true);
	};
	return (
		<AuthFrame
			title="RESET ACCESS"
			subtitle="REQUEST A SECURE PASSWORD RESET LINK."
		>
			<Card className="rounded-md border-border bg-card shadow-none">
				<CardContent className="p-5 sm:p-7">
					{error ? (
						<Alert role="alert" className="mb-5">
							{error}
						</Alert>
					) : null}
					{sent ? (
						<div className="space-y-4 text-sm">
							<CheckCircle className="text-status-ok" size={28} />
							<p>
								IF AN ACCOUNT EXISTS FOR THAT EMAIL, A RESET LINK HAS BEEN SENT.
							</p>
							<Link
								className="inline-flex items-center gap-2 text-accent hover:underline"
								to="/login"
							>
								<ArrowLeft size={16} /> BACK TO SIGN IN
							</Link>
						</div>
					) : (
						<form
							className="space-y-5"
							onSubmit={handleSubmit(onSubmit)}
							noValidate
						>
							<div className="space-y-2">
								<Label
									htmlFor="reset-email"
									className="font-mono text-[10px] tracking-[0.16em]"
								>
									EMAIL ADDRESS
								</Label>
								<div className="relative">
									<EnvelopeSimple
										size={18}
										className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
									/>
									<Input
										id="reset-email"
										autoFocus
										autoComplete="email"
										className="min-h-11 rounded-sm pl-10 font-mono text-sm"
										aria-invalid={!!errors.email}
										{...register("email")}
									/>
								</div>
								{errors.email ? (
									<p className="font-mono text-xs text-destructive">
										{errors.email.message}
									</p>
								) : null}
							</div>
							<Button
								className="min-h-11 w-full rounded-sm font-mono text-xs tracking-[0.14em]"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<SpinnerGap className="animate-spin" size={17} /> SENDING...
									</>
								) : (
									"SEND RESET LINK"
								)}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</AuthFrame>
	);
}

export function ResetPasswordPage() {
	const navigate = useNavigate();
	const [show, setShow] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const token = new URLSearchParams(window.location.search).get("token") ?? "";
	const {
		register,
		watch,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<{ password: string; confirmPassword: string }>({
		resolver: zodResolver(resetPasswordSchema),
		mode: "onBlur",
	});
	const onSubmit = async (values: {
		password: string;
		confirmPassword: string;
	}) => {
		setError(null);
		try {
			const result = await authClient.resetPassword({
				newPassword: values.password,
				token,
			});
			if (result.error) throw new Error("reset failed");
			setDone(true);
			window.setTimeout(() => navigate({ to: "/login", replace: true }), 900);
		} catch {
			setError(
				"This reset link is invalid or expired. Request a new link to continue.",
			);
		}
	};
	return (
		<AuthFrame
			title="NEW PASSWORD"
			subtitle="SET A NEW PASSWORD FOR YOUR DISPATCH CONSOLE."
		>
			<Card className="rounded-md border-border bg-card shadow-none">
				<CardContent className="p-5 sm:p-7">
					{error ? (
						<Alert role="alert" className="mb-5">
							{error}
						</Alert>
					) : null}
					{done ? (
						<div className="space-y-3 text-sm">
							<CheckCircle className="text-status-ok" size={28} />
							<p>PASSWORD UPDATED. RETURNING TO SIGN IN...</p>
						</div>
					) : (
						<form
							className="space-y-5"
							onSubmit={handleSubmit(onSubmit)}
							noValidate
						>
							<div className="space-y-2">
								<Label
									htmlFor="new-password"
									className="font-mono text-[10px] tracking-[0.16em]"
								>
									NEW PASSWORD
								</Label>
								<div className="relative">
									<LockKey
										size={18}
										className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
									/>
									<Input
										id="new-password"
										type={show ? "text" : "password"}
										autoComplete="new-password"
										className="min-h-11 rounded-sm px-10 font-mono text-sm"
										aria-invalid={!!errors.password}
										{...register("password")}
									/>
									<button
										type="button"
										aria-label={show ? "Hide password" : "Show password"}
										aria-pressed={show}
										onMouseDown={(event) => event.preventDefault()}
										onClick={() => setShow((value) => !value)}
										className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
									>
										{show ? <EyeSlash size={18} /> : <Eye size={18} />}
									</button>
								</div>
								<p className="font-mono text-[10px] text-muted-foreground">
									{passwordStrength(watch("password") ?? "")}
								</p>
								{errors.password ? (
									<p className="font-mono text-xs text-destructive">
										{errors.password.message}
									</p>
								) : null}
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="confirm-password"
									className="font-mono text-[10px] tracking-[0.16em]"
								>
									CONFIRM PASSWORD
								</Label>
								<Input
									id="confirm-password"
									type={show ? "text" : "password"}
									autoComplete="new-password"
									className="min-h-11 rounded-sm font-mono text-sm"
									aria-invalid={!!errors.confirmPassword}
									{...register("confirmPassword")}
								/>
								{errors.confirmPassword ? (
									<p className="font-mono text-xs text-destructive">
										{errors.confirmPassword.message}
									</p>
								) : null}
							</div>
							<Button
								className="min-h-11 w-full rounded-sm font-mono text-xs tracking-[0.14em]"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<SpinnerGap className="animate-spin" size={17} />{" "}
										UPDATING...
									</>
								) : (
									"UPDATE PASSWORD"
								)}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</AuthFrame>
	);
}
