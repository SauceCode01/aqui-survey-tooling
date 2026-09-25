import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { SendEmail } from "@/features/mailing/useCases/SendEmail.js";
import type { IMailerGateway } from "../domain/IMailerGateway.js";

@MakeInjectable
export class MailerGateway implements IMailerGateway {
	public static deps = {
		sendEmail: SendEmail,
	};

	constructor(public deps: DepsType<typeof MailerGateway.deps>) {}

	async notifyAdmin(formSubmission: any): Promise<void> {
		// Implement the logic to send an email notification to the admin
		// You can use a mailing service or library here

		this.deps.sendEmail.execute({
			to: process.env.GMAIL_USER || "daguinotaserwin5@gmail.com",
			subject: "New Form Submission Received",
			body: `A new form submission has been received:\n\n${JSON.stringify(formSubmission, null, 2)}`,
		});
	}
}
