import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { FormSubmission } from "../domain/FormSubmission.js";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";

export type GetFormSubmissionInput = {
	formSubmissionId: string;
};

export type GetFormSubmissionOutput = {
	formSubmission: FormSubmission;
};

@MakeInjectable
export class GetFormSubmission {
	public static deps = {
		formSubmissionRepository: IFormSubmissionRepository,
	};

	constructor(public deps: DepsType<typeof GetFormSubmission.deps>) {}

	async execute(
		props: GetFormSubmissionInput,
	): Promise<GetFormSubmissionOutput> {
		return await this.deps.formSubmissionRepository.GetFormSubmissionById({
			formSubmissionId: props.formSubmissionId,
		});
	}
}
