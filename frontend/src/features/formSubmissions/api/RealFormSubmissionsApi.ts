import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { callApi } from "@/shared/lib/apiClient";
import type {
	CreateSubmissionInput,
	FormSubmission,
	IFormSubmissionsApi,
} from "../types/IFormSubmissionsApi";

interface ApiResponse<T> {
	status: string;
	message: string;
	data: T;
}

@MakeInjectable
export class RealFormSubmissionsApi implements IFormSubmissionsApi {
	public static deps = {};
	public deps: DepsType<typeof RealFormSubmissionsApi.deps>;

	constructor(deps?: DepsType<typeof RealFormSubmissionsApi.deps>) {
		this.deps = deps || {};
	}
	async listSubmissions(sourceId?: string): Promise<FormSubmission[]> {
		const query = sourceId ? `?sourceId=${encodeURIComponent(sourceId)}` : "";
		const res = await callApi<
			ApiResponse<{ formSubmissions: FormSubmission[] }>
		>(`/formSubmissions${query}`);
		return res.data.data.formSubmissions || [];
	}

	async getSubmission(id: string): Promise<FormSubmission> {
		const res = await callApi<ApiResponse<{ formSubmission: FormSubmission }>>(
			`/formSubmissions/${id}`,
		);
		return res.data.data.formSubmission;
	}

	async createSubmission(
		input: CreateSubmissionInput,
	): Promise<{ id: string; email: string }> {
		const res = await callApi<ApiResponse<{ id: string; email: string }>>(
			"/formSubmissions",
			{
				method: "POST",
				body: JSON.stringify({
					body: {
						data: {
							email: input.email,
							answers: input.answers,
							sourceKey: input.sourceKey,
						},
					},
				}),
			},
		);
		return res.data.data;
	}

	async deleteSubmission(id: string): Promise<boolean> {
		const res = await callApi<ApiResponse<{ success: boolean }>>(
			`/formSubmissions/${id}`,
			{
				method: "DELETE",
			},
		);
		return res.data.data.success ?? true;
	}
}
