import { contractRulesDraftSchema, jobDraftSchema, type JobDraft, type ContractRulesDraft } from "@dspv2/shared";

export function parseRuleBasedJob(text: string): JobDraft {
	const lower = sanitizeUntrustedText(text).toLowerCase();
	const equipment = lower.includes("lift") || lower.includes("elevator") ? "elevator" : lower.includes("chiller") ? "chiller" : lower.includes("fridge") || lower.includes("freezer") || lower.includes("cold room") ? "refrigeration" : lower.includes("split") || lower.includes("air condition") || lower.includes("ac ") ? "split unit" : "split unit";
	const safety = /trapped|stuck in (a )?(lift|elevator)|entrapment|smoke|fire|gas leak|flooding|injur(y|ed)/i.test(text);
	const urgency = safety ? "emergency" : /urgent|asap|immediately|critical/i.test(text) ? "high" : "normal";
	const location = text.match(/(?:at|in|on)\s+([^.!?]{3,120})/i)?.[1]?.trim() ?? "";
	return jobDraftSchema.parse({ equipment, skill: equipment, urgency, locationText: location, requester: "Unknown requester", confidence: 0.42, evidenceSpans: [] });
}

export function sanitizeUntrustedText(text: string) {
	return text.replace(/(?:ignore (?:all|any|the) previous|system message|developer message|fake system message|role-play|\[hidden text\]|exfiltrate|mark (?:this|it) resolved|send (?:me|the) (?:api key|database password|secrets?)|assign to [A-Za-z]+).*$/i, "").trim();
}

export function parseRuleBasedContract(text: string, fallbackTier: "gold" | "silver" | "bronze" = "bronze"): ContractRulesDraft {
	const lower = text.toLowerCase();
	const tier = /gold|priority|premium/.test(lower) ? "gold" : /silver/.test(lower) ? "silver" : fallbackTier;
	const responseMatch = lower.match(/(?:respond|response|within|arrival)[^\d]{0,30}(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i);
	const resolutionMatch = lower.match(/(?:resolve|resolution|repair)[^\d]{0,30}(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i);
	const toMinutes = (match: RegExpMatchArray | null, fallback: number) => match ? Number(match[1]) * (match[0].includes("hour") || match[0].includes("hr") ? 60 : 1) : fallback;
	const responseMinutes = toMinutes(responseMatch, tier === "gold" ? 30 : tier === "silver" ? 120 : 240);
	const resolutionMinutes = toMinutes(resolutionMatch, tier === "gold" ? 240 : tier === "silver" ? 480 : 1_440);
	const callbackCap = lower.match(/(\d+)\s+callbacks?/i)?.[1];
	return contractRulesDraftSchema.parse({ rules: [{ tier, responseMinutes, resolutionMinutes, callbackCap: callbackCap ? Number(callbackCap) : null, creditTerms: /credit|refund|penalty/.test(lower) ? text.match(/[^.]{0,100}(?:credit|refund|penalty)[^.]{0,200}/i)?.[0]?.trim() ?? null : null, unclear: !responseMatch || !resolutionMatch, evidence: text.slice(0, 500) }] });
}
