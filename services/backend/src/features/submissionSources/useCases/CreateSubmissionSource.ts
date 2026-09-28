import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { Clock } from "@/shared/time/Clock.js";
import { Uuid } from "@/shared/uuid/Uuid.js";
import { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";
import type {
	SubmissionSource,
	SubmissionSourceCreateDto,
} from "../domain/SubmissionSource.js";

export type CreateSubmissionSourceInput = {
	submissionSource: SubmissionSourceCreateDto;
};

export type CreateSubmissionSourceOutput = {
	submissionSource: SubmissionSource;
};

@MakeInjectable
export class CreateSubmissionSource {
	public static deps = {
		submissionSourceRepository: ISubmissionSourceRepository,
		uuid: Uuid,
		clock: Clock,
	};

	constructor(public deps: DepsType<typeof CreateSubmissionSource.deps>) {}

	async execute(
		props: CreateSubmissionSourceInput,
	): Promise<CreateSubmissionSourceOutput> {
		const source: SubmissionSource = {
			id: this.deps.uuid.generate(),
			createdAt: this.deps.clock.now(),
			updatedAt: this.deps.clock.now(),
			name: props.submissionSource.name,
		};

		await this.deps.submissionSourceRepository.CreateSubmissionSource({
			submissionSource: source,
		});

		return { submissionSource: source };
	}
}
