import type { SubmissionSource } from "./SubmissionSource.js";

export abstract class ISubmissionSourceRepository {
	abstract GetSubmissionSourceById(input: {
		submissionSourceId: string;
	}): Promise<{ submissionSource: SubmissionSource | null }>;
	abstract ListSubmissionSources(input?: {
		page?: number | undefined;
		limit?: number | undefined;
	}): Promise<{
		submissionSources: SubmissionSource[];
		total?: number | undefined;
		page?: number | undefined;
		limit?: number | undefined;
	}>;
	abstract CreateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }>;
	abstract UpdateSubmissionSource(input: {
		submissionSource: SubmissionSource;
	}): Promise<{ submissionSource: SubmissionSource }>;
	abstract DeleteSubmissionSource(input: {
		submissionSourceId: string;
	}): Promise<{ success: boolean }>;
}
