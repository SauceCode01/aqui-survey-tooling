import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";

export type DeleteSubmissionSourceInput = {
	submissionSourceId: string;
};

export type DeleteSubmissionSourceOutput = {
	success: boolean;
};

@MakeInjectable
export class DeleteSubmissionSource {
	public static deps = {
		repo: ISubmissionSourceRepository,
	};

	constructor(public deps: DepsType<typeof DeleteSubmissionSource.deps>) {}

	async execute(
		props: DeleteSubmissionSourceInput,
	): Promise<DeleteSubmissionSourceOutput> {
		return await this.deps.repo.DeleteSubmissionSource({
			submissionSourceId: props.submissionSourceId,
		});
	}
}
