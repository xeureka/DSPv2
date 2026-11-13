import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
	email: z.string().email("Enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [submitting, setSubmitting] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({ resolver: zodResolver(schema) });

	if (session?.user) return <Navigate to="/" replace />;

	const onSubmit = async ({ email, password }: FormValues) => {
		setSubmitting(true);
		const result = await authClient.signIn.email({ email, password });
		setSubmitting(false);
		if (result.error) {
			toast.error(result.error.message || "Unable to sign in");
			return;
		}
		toast.success("Welcome back");
		navigate({ to: "/", replace: true });
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
			<form
				className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
				onSubmit={handleSubmit(onSubmit)}
			>
				<h1 className="text-2xl font-semibold tracking-tight">DispatchPilot</h1>
				<p className="mt-2 text-sm text-slate-500">Sign in to continue.</p>
				<div className="mt-6 space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							{...register("email")}
						/>
						{errors.email?.message ? (
							<p className="text-sm text-destructive">{errors.email.message}</p>
						) : null}
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							{...register("password")}
						/>
						{errors.password?.message ? (
							<p className="text-sm text-destructive">
								{errors.password.message}
							</p>
						) : null}
					</div>
					<Button type="submit" className="w-full" disabled={submitting}>
						{submitting ? "Signing in…" : "Sign in"}
					</Button>
				</div>
			</form>
		</main>
	);
}
