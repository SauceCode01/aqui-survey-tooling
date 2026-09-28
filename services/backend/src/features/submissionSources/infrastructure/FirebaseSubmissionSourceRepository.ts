import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { AppError } from "@/errors/AppError.js";
import { FirebaseClient } from "@/infrastructure/FirebaseClient.js";
import { Clock } from "@/shared/time/Clock.js";
import type { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";
import type { SubmissionSource } from "../domain/SubmissionSource.js";

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
		const doc = await this.deps.fbClient.getDocumentById<{
			name: string;
			createdAt: string;
			updatedAt: string;
		}>("submissionSources", input.submissionSourceId);
		if (!doc) {
			throw new AppError(
				`Submission source with id ${input.submissionSourceId} not found`,
				404,
			);
		}
		const submissionSource: SubmissionSource = {
			id: doc.id,
			name: doc.name,
			createdAt: this.deps.clock.fromIso(doc.createdAt),
			updatedAt: this.deps.clock.fromIso(doc.updatedAt),
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
		const snapshot = await this.deps.fbClient.db
			.collection("submissionSources")
			.get();
		const submissionSources: SubmissionSource[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name,
				createdAt: this.deps.clock.fromIso(data.createdAt as string),
				updatedAt: this.deps.clock.fromIso(data.updatedAt as string),
			};
		});
		return {
			submissionSources,
			total: submissionSources.length,
			page: input?.page ?? 1,
			limit: input?.limit ?? submissionSources.length,
		};
	}

	async CreateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }> {
		await this.deps.fbClient.createWithCustomId(
			"submissionSources",
			input.submissionSource.id,
			{
				name: input.submissionSource.name,
				createdAt: this.deps.clock.toIso(input.submissionSource.createdAt),
				updatedAt: this.deps.clock.toIso(input.submissionSource.updatedAt),
			},
		);
		return { submissionSource: input.submissionSource };
	}

	async UpdateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }> {
		await this.deps.fbClient.db
			.collection("submissionSources")
			.doc(input.submissionSource.id)
			.set(
				{
					name: input.submissionSource.name,
					updatedAt: this.deps.clock.toIso(input.submissionSource.updatedAt),
				},
				{ merge: true },
			);
		return { submissionSource: input.submissionSource };
	}

	async DeleteSubmissionSource(input: {
		submissionSourceId: string;
	}): Promise<{ success: boolean }> {
		await this.deps.fbClient.db
			.collection("submissionSources")
			.doc(input.submissionSourceId)
			.delete();
		return { success: true };
	}
}
