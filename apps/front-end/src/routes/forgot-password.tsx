import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/features/auth/components/password-reset-pages";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});
