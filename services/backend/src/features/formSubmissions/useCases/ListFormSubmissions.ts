import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { FormSubmission } from "../domain/FormSubmission.js";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";

export type ListFormSubmissionsInput = {
	page?: number | undefined;
	limit?: number | undefined;
	sourceId?: string | undefined;
};

export type ListFormSubmissionsOutput = {
	formSubmissions: FormSubmission[];
	total?: number | undefined;
	page?: number | undefined;
	limit?: number | undefined;
};

@MakeInjectable
export class ListFormSubmissions {
	public static deps = {
		formSubmissionRepository: IFormSubmissionRepository,
	};

	constructor(public deps: DepsType<typeof ListFormSubmissions.deps>) {}

	async execute(
		props: ListFormSubmissionsInput,
	): Promise<ListFormSubmissionsOutput> {
		return await this.deps.formSubmissionRepository.ListFormSubmissions(props);
	}
}
