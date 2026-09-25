import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";
import type { SubmissionSource } from "../domain/SubmissionSource.js";

export type ListSubmissionSourcesInput = {
	page?: number | undefined;
	limit?: number | undefined;
};

export type ListSubmissionSourcesOutput = {
	submissionSources: SubmissionSource[];
	total?: number | undefined;
	page?: number | undefined;
	limit?: number | undefined;
};

@MakeInjectable
export class ListSubmissionSources {
	public static deps = {
		repo: ISubmissionSourceRepository,
	};

	constructor(public deps: DepsType<typeof ListSubmissionSources.deps>) {}

	async execute(
		props?: ListSubmissionSourcesInput,
	): Promise<ListSubmissionSourcesOutput> {
		return await this.deps.repo.ListSubmissionSources(props);
	}
}
