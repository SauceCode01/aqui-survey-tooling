import type { Container, DIModule } from "@solid-stack/di";
import { IMailer } from "./domain/IMailer.js";
import { GmailMailer } from "./infrastructure/GmailMailer.js";
import { MemoryMailer } from "./infrastructure/MemoryMailer.js";

export const MailingProvider: DIModule = (c: Container) => {
	const isIsolated = process.env.INFRA_MODE === "isolated";

	if (isIsolated) {
		c.provide(IMailer, MemoryMailer);
	} else {
		c.provide(IMailer, GmailMailer);
	}
};

export default MailingProvider;
