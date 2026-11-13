import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/features/auth/components/password-reset-pages";

export const Route = createFileRoute("/reset-password")({
	component: ResetPasswordPage,
});
