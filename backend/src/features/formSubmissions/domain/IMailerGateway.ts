import type { FormSubmission } from "./FormSubmission.js";

export abstract class IMailerGateway {
	abstract notifyAdmin: (formSubmission: FormSubmission) => Promise<void>;
}
