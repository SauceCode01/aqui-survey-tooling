import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";

export type DeleteFormSubmissionInput = {
	formSubmissionId: string;
};

export type DeleteFormSubmissionOutput = {
	success: boolean;
};

@MakeInjectable
export class DeleteFormSubmission {
	public static deps = {
		formSubmissionRepository: IFormSubmissionRepository,
	};

	constructor(public deps: DepsType<typeof DeleteFormSubmission.deps>) {}

	async execute(
		props: DeleteFormSubmissionInput,
	): Promise<DeleteFormSubmissionOutput> {
		return await this.deps.formSubmissionRepository.DeleteFormSubmission({
			formSubmissionId: props.formSubmissionId,
		});
	}
}
