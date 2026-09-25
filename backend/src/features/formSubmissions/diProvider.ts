import type { Container, DIModule } from "@solid-stack/di";
import { IFormSubmissionRepository } from "./domain/IFormSubmissionRepository.js";
import { IMailerGateway } from "./domain/IMailerGateway.js";
import { FirebaseFormSubmissionRepository } from "./infrastructure/FirebaseFormSubmissionRepository.js";
import { MailerGateway } from "./infrastructure/MailerGateway.js";

export const FormSubmissionsProvider: DIModule = (c: Container) => {
	c.provide(IFormSubmissionRepository, FirebaseFormSubmissionRepository);

	c.provide(IMailerGateway, MailerGateway);
};

export default FormSubmissionsProvider;
