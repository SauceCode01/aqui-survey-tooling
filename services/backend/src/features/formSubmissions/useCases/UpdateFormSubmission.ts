import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { FormSubmission } from "../domain/FormSubmission.js";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";

export type UpdateFormSubmissionInput = {
	formSubmission: FormSubmission;
};

export type UpdateFormSubmissionOutput = {
	formSubmission: FormSubmission;
};

@MakeInjectable
export class UpdateFormSubmission {
	public static deps = {
		formSubmissionRepository: IFormSubmissionRepository,
	};

	constructor(public deps: DepsType<typeof UpdateFormSubmission.deps>) {}

	async execute(
		props: UpdateFormSubmissionInput,
	): Promise<UpdateFormSubmissionOutput> {
		return await this.deps.formSubmissionRepository.UpdateFormSubmission({
			formSubmission: props.formSubmission,
		});
	}
}
