export type OutboundMessage = {
	to: string;
	subject: string;
	body: string;
};

export interface MailerAdapter {
	send(
		message: OutboundMessage,
	): Promise<{ accepted: boolean; simulated: boolean }>;
}

export class DryRunMailer implements MailerAdapter {
	async send(_message: OutboundMessage) {
		return { accepted: true, simulated: true };
	}
}
