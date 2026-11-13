import { z } from "zod";

export const forgotPasswordSchema = z.object({
	email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
	.object({
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Confirm your password"),
	})
	.refine((value) => value.password === value.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords do not match",
	});

export function passwordStrength(password: string) {
	if (password.length < 8) return "Use at least 8 characters";
	if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
		return "Add a number and an uppercase letter for a stronger password";
	return "Strong password";
}
