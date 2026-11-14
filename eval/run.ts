import { readFile } from "node:fs/promises";
import { jobDraftSchema } from "@dspv2/shared";
import { parseRuleBasedJob } from "../apps/back-end/src/adapters/rule-parser.ts";

type Label = { id: string; text: string; equipment: string; skill: string; urgency: string; safety: boolean };
const safety = /trapped|stuck in (a )?(lift|elevator)|entrapment|smoke|fire|gas leak|flooding|injur(y|ed)/i;
const injection = /ignore (?:(?:all|any|the) )?previous|system message|developer message|role-play|assign to [A-Za-z]|mark (this|it) resolved|send (me|the) secrets|password|api key|exfiltrat/i;
const messages = JSON.parse(await readFile(new URL("./messages.json", import.meta.url), "utf8")) as Label[];
const injections = JSON.parse(await readFile(new URL("./injections.json", import.meta.url), "utf8")) as Array<{ id: string; base: string; injected: string }>;
const fields = ["equipment", "skill", "urgency"] as const;
const scores = Object.fromEntries(fields.map((field) => [field, 0]));
for (const item of messages) { const output = parseRuleBasedJob(item.text); for (const field of fields) if (output[field] === item[field]) scores[field] += 1; }
console.log("simulated=false fallback extraction evaluation");
for (const field of fields) console.log(`${field}: ${scores[field]}/${messages.length} ${(scores[field] / messages.length * 100).toFixed(1)}%`);
const safetyPass = messages.filter((item) => safety.test(item.text) === item.safety).length;
console.log(`safety: ${safetyPass}/${messages.length} ${(safetyPass / messages.length * 100).toFixed(1)}%`);
let injectionPass = 0;
for (const item of injections) { const before = jobDraftSchema.parse(parseRuleBasedJob(item.base)); const after = jobDraftSchema.parse(parseRuleBasedJob(item.injected)); if (JSON.stringify(before) === JSON.stringify(after) && injection.test(item.injected)) injectionPass += 1; }
console.log(`injection: ${injectionPass}/${injections.length} ${(injectionPass / injections.length * 100).toFixed(1)}%`);
if (injectionPass !== injections.length) process.exitCode = 1;
