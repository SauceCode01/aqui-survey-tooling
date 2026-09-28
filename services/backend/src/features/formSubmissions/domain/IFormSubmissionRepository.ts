import type { FormSubmission } from "./FormSubmission.js";

export abstract class IFormSubmissionRepository {
	abstract GetFormSubmissionById(input: {
		formSubmissionId: string;
	}): Promise<{ formSubmission: FormSubmission }>;
	abstract ListFormSubmissions(input?: {
		page?: number | undefined;
		limit?: number | undefined;
		sourceId?: string | undefined;
	}): Promise<{
		formSubmissions: FormSubmission[];
		total?: number | undefined;
		page?: number | undefined;
		limit?: number | undefined;
	}>;
	abstract CreateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }>;
	abstract UpdateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }>;
	abstract DeleteFormSubmission(input: {
		formSubmissionId: string;
	}): Promise<{ success: boolean }>;
}
