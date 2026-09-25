import type { Container, DIModule } from "@solid-stack/di";
import { IFormSubmissionRepository } from "./domain/IFormSubmissionRepository.js";
import { IMailerGateway } from "./domain/IMailerGateway.js";
import { ISourceGateway } from "./domain/ISourceGateway.js";
import { FirebaseFormSubmissionRepository } from "./infrastructure/FirebaseFormSubmissionRepository.js";
import { MailerGateway } from "./infrastructure/MailerGateway.js";
import { SourceGateway } from "./infrastructure/SourceGateway.js";

export const FormSubmissionsProvider: DIModule = (c: Container) => {
	c.provide(IFormSubmissionRepository, FirebaseFormSubmissionRepository);

	c.provide(IMailerGateway, MailerGateway);
	c.provide(ISourceGateway, SourceGateway);
};

export default FormSubmissionsProvider;
