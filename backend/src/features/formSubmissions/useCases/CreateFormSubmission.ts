import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { Clock } from "@/shared/time/Clock.js";
import { Uuid } from "@/shared/uuid/Uuid.js";
import type {
	FormSubmission,
	FormSubmissionCreatDTO,
} from "../domain/FormSubmission.js";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";
import { IMailerGateway } from "../domain/IMailerGateway.js";
import { ISourceGateway } from "../domain/ISourceGateway.js";

export type CreateFormSubmissionInput = {
	createDto: FormSubmissionCreatDTO;
	sourceKey: string;
};

export type CreateFormSubmissionOutput = {
	formSubmission: FormSubmission;
};

@MakeInjectable
export class CreateFormSubmission {
	public static deps = {
		formSubmissionRepository: IFormSubmissionRepository,
		uuid: Uuid,
		clock: Clock,
		mailer: IMailerGateway,
		source: ISourceGateway,
	};

	constructor(public deps: DepsType<typeof CreateFormSubmission.deps>) {}

	async execute(
		props: CreateFormSubmissionInput,
	): Promise<CreateFormSubmissionOutput> {
		// validate source key
		const validationResult = await this.deps.source.validateKey({
			key: props.sourceKey,
		});
		if (!validationResult.isValid) {
			throw new Error("Invalid source key");
		}

		const formSubmission: FormSubmission = {
			id: this.deps.uuid.generate(),
			createdAt: this.deps.clock.now(),
			updatedAt: this.deps.clock.now(),
			email: props.createDto.email,
			answers: props.createDto.answers,
			sourceId: validationResult.sourceId,
		};

		// send email
		this.deps.mailer.notifyAdmin(formSubmission);

		return await this.deps.formSubmissionRepository.CreateFormSubmission({
			formSubmission: formSubmission,
		});
	}
}
