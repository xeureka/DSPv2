export const safetyPattern = /trapped|stuck in (a )?(lift|elevator)|entrapment|smoke|fire|gas leak|flooding|injur(y|ed)/i;
export const injectionPattern = /ignore (all|any|the)?\s*previous|system message|developer message|assign to [A-Za-z]|mark (this|it) resolved|send (me|the) secrets|password|api key|exfiltrat|role-play/i;
export function scanSafety(text: string) { return safetyPattern.test(text); }
export function detectPromptInjection(text: string) { return injectionPattern.test(text); }
