import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { SendEmail } from "@/features/mailing/useCases/SendEmail.js";
import type {
	FormSubmission,
	QuestionAnswer,
} from "../domain/FormSubmission.js";
import type { IMailerGateway } from "../domain/IMailerGateway.js";
// 1. Fixed TS2834: Added .js extension to the import path.
// (Update the actual folder/file name to match your project structure)

@MakeInjectable
export class MailerGateway implements IMailerGateway {
	public static deps = {
		sendEmail: SendEmail,
	};

	constructor(public deps: DepsType<typeof MailerGateway.deps>) {}

	async notifyAdmin(formSubmission: FormSubmission): Promise<void> {
		const htmlBody = this.buildHtmlEmail(formSubmission);

		await this.deps.sendEmail.execute({
			to: process.env.ADMIN_EMAIL || "daguinotaserwin5@gmail.com",
			subject: `New Form Submission: ${formSubmission.sourceId}`,
			body: htmlBody,
			isHtml: true,
		});
	}

	/**
	 * Constructs the main HTML structure for the email.
	 */
	private buildHtmlEmail(submission: FormSubmission): string {
		const dateString = String(submission.createdAt);
		const rawJson = JSON.stringify(submission, null, 2);

		return `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333; line-height: 1.5;">
                <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px;">
                    New Form Submission Received
                </h2>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #e9ecef;">
                    <h3 style="margin-top: 0; color: #495057; font-size: 16px;">Submission Details</h3>
                    <table style="width: 100%; font-size: 14px; text-align: left;">
                        <tr><th style="width: 120px; padding-bottom: 5px;">Submission ID:</th><td>${this.escapeHtml(submission.id)}</td></tr>
                        <tr><th style="padding-bottom: 5px;">Source ID:</th><td>${this.escapeHtml(submission.sourceId)}</td></tr>
                        <tr><th style="padding-bottom: 5px;">Email:</th><td><a href="mailto:${this.escapeHtml(submission.email)}" style="color: #0056b3;">${this.escapeHtml(submission.email)}</a></td></tr>
                        <tr><th>Submitted At:</th><td>${this.escapeHtml(dateString)}</td></tr>
                    </table>
                </div>

                <div>
                    <h3 style="color: #495057; border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">User Answers</h3>
                    ${submission.answers.map((ans: QuestionAnswer) => this.formatQuestionAnswer(ans)).join("")}
                </div>
                
                <div style="margin-top: 30px;">
                    <h3 style="color: #495057; border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">Raw Submission Data (JSON)</h3>
                    <p style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">Click inside the box to highlight all text, then copy.</p>
                    <div style="background-color: #272822; color: #f8f8f2; padding: 15px; border-radius: 6px; overflow-x: auto; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all; user-select: all;">
                        <pre style="margin: 0; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(rawJson)}</pre>
                    </div>
                </div>

                <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; text-align: center;">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        `;
	}

	/**
	 * Dynamically formats individual answers based on their specific answerType.
	 */
	private formatQuestionAnswer(qa: QuestionAnswer): string {
		let answerHtml = "";

		switch (qa.answerType) {
			case "string":
				answerHtml = `<p style="margin: 5px 0 15px 15px; color: #212529; background: #fff; padding: 10px; border-left: 3px solid #0056b3;">
                                ${this.escapeHtml(qa.answer).replace(/\n/g, "<br/>")}
                              </p>`;
				break;

			case "string[]": {
				const listItems = qa.answer
					// 2. Fixed TS7006: Added explicit 'string' type to item
					.map((item: string) => `<li>${this.escapeHtml(item)}</li>`)
					.join("");
				answerHtml = `<ul style="margin: 5px 0 15px 15px; color: #212529;">${listItems}</ul>`;
				break;
			}

			case "string[][]": {
				const rows = qa.answer
					// 3. Fixed TS7006: Added explicit 'string[]' type to row
					.map((row: string[]) => {
						const cells = row
							// 4. Fixed TS7006: Added explicit 'string' type to cell
							.map(
								(cell: string) =>
									`<td style="padding: 8px; border: 1px solid #dee2e6;">${this.escapeHtml(cell)}</td>`,
							)
							.join("");
						return `<tr>${cells}</tr>`;
					})
					.join("");

				answerHtml = `
                    <table style="margin: 10px 0 20px 15px; border-collapse: collapse; width: 95%; font-size: 14px; color: #212529;">
                        <tbody>${rows}</tbody>
                    </table>`;
				break;
			}

			default:
				answerHtml = `<p style="color: red;">Unrecognized answer format.</p>`;
		}

		return `
            <div style="margin-bottom: 25px;">
                <strong style="display: block; font-size: 15px; color: #212529;">
                    ${this.escapeHtml(qa.question)}
                </strong>
                <span style="font-size: 12px; color: #868e96; display: block; margin-bottom: 8px;">
                    Question Type: ${this.escapeHtml(qa.questionType)}
                </span>
                ${answerHtml}
            </div>
        `;
	}

	/**
	 * Sanitizes strings for safe HTML rendering to prevent broken layouts or XSS.
	 */
	private escapeHtml(unsafe: string): string {
		if (!unsafe) return "";
		return String(unsafe)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}
}
