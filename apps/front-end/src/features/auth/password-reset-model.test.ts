import assert from "node:assert/strict";
import test from "node:test";
import {
	forgotPasswordSchema,
	passwordStrength,
	resetPasswordSchema,
} from "./password-reset-model";

test("password reset validation confirms matching passwords", () => {
	assert.equal(forgotPasswordSchema.safeParse({ email: "bad" }).success, false);
	assert.equal(
		resetPasswordSchema.safeParse({
			password: "short",
			confirmPassword: "short",
		}).success,
		false,
	);
	assert.equal(
		resetPasswordSchema.safeParse({
			password: "Secure123",
			confirmPassword: "Secure123",
		}).success,
		true,
	);
	assert.equal(
		resetPasswordSchema.safeParse({
			password: "Secure123",
			confirmPassword: "different",
		}).success,
		false,
	);
});

test("password strength hint is deterministic", () => {
	assert.equal(passwordStrength(""), "Use at least 8 characters");
	assert.match(passwordStrength("password"), /uppercase/);
	assert.equal(passwordStrength("Secure123"), "Strong password");
});
