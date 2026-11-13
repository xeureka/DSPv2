import assert from "node:assert/strict";
import test from "node:test";
import { typewriterFrame } from "./typewriter-dispatch-model";

test("reduced motion renders a complete static dispatch line", () => {
	const frame = typewriterFrame("JOB-014 received", 2, true);
	assert.equal(frame.text, "JOB-014 received");
	assert.equal(frame.column, 17);
});

test("animated frame exposes the current line and column", () => {
	const frame = typewriterFrame("JOB-014 received", 4, false);
	assert.equal(frame.text, "JOB-");
	assert.equal(frame.column, 5);
});
