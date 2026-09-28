import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";
import type { SubmissionSource } from "../domain/SubmissionSource.js";

@MakeInjectable
export class StubSubmissionSourceRepository
	implements ISubmissionSourceRepository
{
	public static deps = {};

	private submissionSources: Map<string, SubmissionSource> = new Map();
	private errorToThrow: Error | null = null;

	constructor(
		public deps: DepsType<typeof StubSubmissionSourceRepository.deps>,
	) {}

	// --- Test Helpers ---
	public clear(): void {
		this.submissionSources.clear();
		this.errorToThrow = null;
	}

	public addSubmissionSource(submissionSource: SubmissionSource): void {
		this.submissionSources.set(submissionSource.id, { ...submissionSource });
	}

	public getSubmissionSources(): SubmissionSource[] {
		return Array.from(this.submissionSources.values()).map((e) => ({ ...e }));
	}

	public setError(error: Error | null): void {
		this.errorToThrow = error;
	}

	// --- ISubmissionSourceRepository Methods ---
	async GetSubmissionSourceById(input: {
		submissionSourceId: string;
	}): Promise<{ submissionSource: SubmissionSource }> {
		if (this.errorToThrow) throw this.errorToThrow;
		const found = this.submissionSources.get(input.submissionSourceId);
		if (!found)
			throw new Error(
				"SubmissionSource with ID " + input.submissionSourceId + " not found",
			);
		return { submissionSource: { ...found } };
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
		if (this.errorToThrow) throw this.errorToThrow;
		let all = this.getSubmissionSources();
		const total = all.length;
		if (input?.page && input?.limit) {
			const start = (input.page - 1) * input.limit;
			all = all.slice(start, start + input.limit);
			return {
				submissionSources: all,
				total,
				page: input.page,
				limit: input.limit,
			};
		}
		return { submissionSources: all, total };
	}

	async CreateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }> {
		if (this.errorToThrow) throw this.errorToThrow;
		const entity = { ...input.submissionSource };
		this.submissionSources.set(entity.id, entity);
		return { submissionSource: { ...entity } };
	}

	async UpdateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }> {
		if (this.errorToThrow) throw this.errorToThrow;
		if (!this.submissionSources.has(input.submissionSource.id)) {
			throw new Error(
				"SubmissionSource with ID " + input.submissionSource.id + " not found",
			);
		}
		const entity = { ...input.submissionSource };
		this.submissionSources.set(entity.id, entity);
		return { submissionSource: { ...entity } };
	}

	async DeleteSubmissionSource(input: {
		submissionSourceId: string;
	}): Promise<{ success: boolean }> {
		if (this.errorToThrow) throw this.errorToThrow;
		this.submissionSources.delete(input.submissionSourceId);
		return { success: true };
	}
}
