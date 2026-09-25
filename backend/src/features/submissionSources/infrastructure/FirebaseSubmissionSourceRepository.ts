import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { FirebaseClient } from "@/infrastructure/FirebaseClient.js";
import { Clock } from "@/shared/time/Clock.js";
import type { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";
import type { SubmissionSource } from "../domain/SubmissionSource.js";
import { AppError } from "@/errors/AppError.js";

@MakeInjectable
export class FirebaseSubmissionSourceRepository
	implements ISubmissionSourceRepository
{
	public static deps = {
		fbClient: FirebaseClient,
		clock: Clock,
	};

	constructor(
		public deps: DepsType<typeof FirebaseSubmissionSourceRepository.deps>,
	) {}

	async GetSubmissionSourceById(input: {
		submissionSourceId: string;
	}): Promise<{ submissionSource: SubmissionSource }> {
		const doc = await this.deps.fbClient.getDocumentById<SubmissionSource>(
			"submissionSources",
			input.submissionSourceId,
		);
		if (!doc) {
			throw new AppError(`Submission source with id ${input.submissionSourceId} not found`, 404);
		}
		const submissionSource: SubmissionSource = {
			id: doc.id,
			name: doc.name,
			createdAt: this.deps.clock.fromIso(doc.createdAt as unknown as string),
			updatedAt: this.deps.clock.fromIso(doc.updatedAt as unknown as string),
		};
		return { submissionSource };
	}

	async ListSubmissionSources(input?: {
		page?: number | undefined;
		limit?: number | undefined;
	}): Promise<{
		submissionSources: SubmissionSource[];
		total?: number | undefined;
		page?: number | undefined;
		limit?: number | undefined;
	}> {
		throw new Error("not implemented");
	}

	async CreateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }> {
		await this.deps.fbClient.createWithCustomId(
			"submissionSources",
			input.submissionSource.id,
			{
				...input.submissionSource,
				createdAt: this.deps.clock.toIso(input.submissionSource.createdAt),
				updatedAt: this.deps.clock.toIso(input.submissionSource.updatedAt),
			},
		);
		return { submissionSource: input.submissionSource };
	}

	async UpdateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }> {
		throw new Error("not implemented");
	}

	async DeleteSubmissionSource(input: {
		submissionSourceId: string;
	}): Promise<{ success: boolean }> {
		throw new Error("not implemented");
	}
}
