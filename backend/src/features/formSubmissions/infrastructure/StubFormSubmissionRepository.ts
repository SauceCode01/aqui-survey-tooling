import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { FormSubmission } from "../domain/FormSubmission.js";
import type { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";

@MakeInjectable
export class StubFormSubmissionRepository implements IFormSubmissionRepository {
	public static deps = {};

	private formSubmissions: Map<string, FormSubmission> = new Map();
	private errorToThrow: Error | null = null;

	constructor(
		public deps: DepsType<typeof StubFormSubmissionRepository.deps>,
	) {}

	// --- Test Helpers ---
	public clear(): void {
		this.formSubmissions.clear();
		this.errorToThrow = null;
	}

	public addFormSubmission(formSubmission: FormSubmission): void {
		this.formSubmissions.set(formSubmission.id, { ...formSubmission });
	}

	public getFormSubmissions(): FormSubmission[] {
		return Array.from(this.formSubmissions.values()).map((e) => ({ ...e }));
	}

	public setError(error: Error | null): void {
		this.errorToThrow = error;
	}

	// --- IFormSubmissionRepository Methods ---
	async GetFormSubmissionById(input: {
		formSubmissionId: string;
	}): Promise<{ formSubmission: FormSubmission }> {
		if (this.errorToThrow) throw this.errorToThrow;
		const found = this.formSubmissions.get(input.formSubmissionId);
		if (!found)
			throw new Error(
				`FormSubmission with ID ${input.formSubmissionId} not found`,
			);
		return { formSubmission: { ...found } };
	}

	async ListFormSubmissions(input?: {
		page?: number | undefined;
		limit?: number | undefined;
	}): Promise<{
		formSubmissions: FormSubmission[];
		total?: number | undefined;
		page?: number | undefined;
		limit?: number | undefined;
	}> {
		if (this.errorToThrow) throw this.errorToThrow;
		let all = this.getFormSubmissions();
		const total = all.length;
		if (input?.page && input?.limit) {
			const start = (input.page - 1) * input.limit;
			all = all.slice(start, start + input.limit);
			return {
				formSubmissions: all,
				total,
				page: input.page,
				limit: input.limit,
			};
		}
		return { formSubmissions: all, total };
	}

	async CreateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }> {
		if (this.errorToThrow) throw this.errorToThrow;
		const entity = { ...input.formSubmission };
		this.formSubmissions.set(entity.id, entity);
		return { formSubmission: { ...entity } };
	}

	async UpdateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }> {
		if (this.errorToThrow) throw this.errorToThrow;
		if (!this.formSubmissions.has(input.formSubmission.id)) {
			throw new Error(
				`FormSubmission with ID ${input.formSubmission.id} not found`,
			);
		}
		const entity = { ...input.formSubmission };
		this.formSubmissions.set(entity.id, entity);
		return { formSubmission: { ...entity } };
	}

	async DeleteFormSubmission(input: {
		formSubmissionId: string;
	}): Promise<{ success: boolean }> {
		if (this.errorToThrow) throw this.errorToThrow;
		this.formSubmissions.delete(input.formSubmissionId);
		return { success: true };
	}
}
