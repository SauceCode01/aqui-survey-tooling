import type { Container, DIModule } from "@solid-stack/di";
import { IMailer } from "./domain/IMailer.js";
import { GmailMailer } from "./infrastructure/GmailMailer.js";

export const MailingProvider: DIModule = (c: Container) => {
	c.provide(IMailer, GmailMailer);
};

export default MailingProvider;
