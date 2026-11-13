import assert from "node:assert/strict";
import test from "node:test";
import {
	createSubmitGate,
	loginSchema,
	passwordInputType,
	signInPayload,
} from "./login-model";

test("login validation reports email and password errors", () => {
	const result = loginSchema.safeParse({
		email: "not-an-email",
		password: "",
		rememberMe: true,
	});
	assert.equal(result.success, false);
	if (!result.success)
		assert.deepEqual(
			result.error.issues.map((issue) => issue.message),
			["Enter a valid email address", "Password is required"],
		);
});

test("password visibility changes only the input type", () => {
	assert.equal(passwordInputType(false), "password");
	assert.equal(passwordInputType(true), "text");
});

test("remember-me value reaches the Better Auth payload", () => {
	assert.deepEqual(
		signInPayload({
			email: "a@example.com",
			password: "secret",
			rememberMe: false,
		}),
		{ email: "a@example.com", password: "secret", rememberMe: false },
	);
});

test("submit gate rejects double submission until finished", () => {
	const gate = createSubmitGate();
	assert.equal(gate.tryStart(), true);
	assert.equal(gate.tryStart(), false);
	gate.finish();
	assert.equal(gate.tryStart(), true);
});
