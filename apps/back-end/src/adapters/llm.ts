export type ExtractionResult = {
	text: string;
	confidence: number;
};

export interface LlmAdapter {
	extractJob(text: string): Promise<ExtractionResult>;
}

export class RuleBasedLlmAdapter implements LlmAdapter {
	async extractJob(text: string) {
		return {
			text,
			confidence: 0,
		};
	}
}
