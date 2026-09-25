import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { callApi } from "@/shared/lib/apiClient";
import type {
	CreateSourceInput,
	ISubmissionSourcesApi,
	SourceKey,
	SubmissionSource,
} from "../types/ISubmissionSourcesApi";

interface ApiResponse<T> {
	status: string;
	message: string;
	data: T;
}

@MakeInjectable
export class RealSubmissionSourcesApi implements ISubmissionSourcesApi {
	public static deps = {};
	public deps: DepsType<typeof RealSubmissionSourcesApi.deps>;

	constructor(deps?: DepsType<typeof RealSubmissionSourcesApi.deps>) {
		this.deps = deps || {};
	}
	async listSources(): Promise<SubmissionSource[]> {
		const res =
			await callApi<ApiResponse<{ submissionSources: SubmissionSource[] }>>(
				"/submissionSources",
			);
		return res.data.data.submissionSources || [];
	}

	async getSource(id: string): Promise<SubmissionSource> {
		const res = await callApi<
			ApiResponse<{ submissionSource: SubmissionSource }>
		>(`/submissionSources/${id}`);
		return res.data.data.submissionSource;
	}

	async createSource(input: CreateSourceInput): Promise<SubmissionSource> {
		const res = await callApi<ApiResponse<{ id: string }>>(
			"/submissionSources",
			{
				method: "POST",
				body: JSON.stringify({ data: { name: input.name } }),
			},
		);

		return {
			id: res.data.data.id,
			name: input.name,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
	}

	async deleteSource(id: string): Promise<boolean> {
		const res = await callApi<ApiResponse<{ success: boolean }>>(
			`/submissionSources/${id}`,
			{
				method: "DELETE",
			},
		);
		return res.data.data.success ?? true;
	}

	async createKey(sourceId: string): Promise<{ key: string }> {
		const res = await callApi<ApiResponse<{ key: string }>>(
			"/submissionSources/createkey",
			{
				method: "POST",
				body: JSON.stringify({ data: { id: sourceId } }),
			},
		);
		return { key: res.data.data.key };
	}

	async listKeys(sourceId?: string): Promise<SourceKey[]> {
		const query = sourceId
			? `?submissionSourceId=${encodeURIComponent(sourceId)}`
			: "";
		const res = await callApi<ApiResponse<{ keys: SourceKey[] }>>(
			`/submissionSources/keys${query}`,
		);
		return res.data.data.keys || [];
	}

	async revokeKey(keyId: string): Promise<boolean> {
		const res = await callApi<ApiResponse<{ success: boolean }>>(
			"/submissionSources/revoke-key",
			{
				method: "POST",
				body: JSON.stringify({ data: { keyId } }),
			},
		);
		return res.data.data.success ?? true;
	}
}
