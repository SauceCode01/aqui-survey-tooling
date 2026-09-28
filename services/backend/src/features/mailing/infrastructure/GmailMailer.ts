import { type DepsType, MakeInjectable } from "@solid-stack/di";
import nodemailer, { type Mail, type SendMailOptions } from "nodemailer";
import type { IMailer, SentMail } from "../domain/IMailer.js";

@MakeInjectable
export class GmailMailer implements IMailer {
	private transporter: Mail;

	public static deps = {};

	constructor(public deps: DepsType<typeof GmailMailer.deps>) {
		// 1. Create a transporter using Gmail SMTP configurations
		this.transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_APP_PASS, // Your 16-character App Password
			},
		});
	}

	async send(mail: {
		to: string;
		subject: string;
		body: string;
		isHtml?: boolean | undefined;
	}): Promise<{ ok: boolean }> {
		const mailOptions: SendMailOptions = {
			from: `${process.env.APP_NAME || "aqui survey app"} <${process.env.GMAIL_USER}>`,
			to: mail.to,
			subject: mail.subject,
			// Only set text if it's NOT HTML, otherwise plain-text readers see raw HTML tags
			text: mail.isHtml ? undefined : mail.body,
			// Only set HTML if isHtml is true
			html: mail.isHtml ? mail.body : undefined,
		};

		try {
			const info = await this.transporter.sendMail(mailOptions);
			console.log("Email sent successfully!");
			console.log("Message ID:", info.messageId);
			return { ok: true };
		} catch (error) {
			console.error("Error sending email:", error);
			// Return false if the email failed to send
			return { ok: false };
		}
	}

	getSentMails(): SentMail[] {
		throw new Error("not implemented");
	}

	clear(): void {
		throw new Error("not implemented");
	}

	setSimulateFailure(fail: boolean): void {
		throw new Error("not implemented");
	}
}
