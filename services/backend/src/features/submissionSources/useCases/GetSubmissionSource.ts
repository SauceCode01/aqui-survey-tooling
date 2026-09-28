import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { NotFoundError } from "@/errors/NotFoundError.js";
import { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";
import type { SubmissionSource } from "../domain/SubmissionSource.js";

export type GetSubmissionSourceInput = {
	submissionSourceId: string;
};

export type GetSubmissionSourceOutput = {
	submissionSource: SubmissionSource;
};

@MakeInjectable
export class GetSubmissionSource {
	public static deps = {
		repo: ISubmissionSourceRepository,
	};

	constructor(public deps: DepsType<typeof GetSubmissionSource.deps>) {}

	async execute(
		props: GetSubmissionSourceInput,
	): Promise<GetSubmissionSourceOutput> {
		const result = await this.deps.repo.GetSubmissionSourceById({
			submissionSourceId: props.submissionSourceId,
		});
		if (!result.submissionSource) {
			throw new NotFoundError(
				`Submission source with id ${props.submissionSourceId} not found`,
			);
		}
		return { submissionSource: result.submissionSource };
	}
}
