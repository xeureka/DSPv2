import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("Enter a valid email address"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function passwordInputType(showPassword: boolean) {
	return showPassword ? "text" : "password";
}

export function signInPayload(values: LoginFormValues) {
	return {
		email: values.email,
		password: values.password,
		rememberMe: values.rememberMe,
	};
}

export function createSubmitGate() {
	let active = false;
	return {
		tryStart() {
			if (active) return false;
			active = true;
			return true;
		},
		finish() {
			active = false;
		},
	};
}
