export interface SubmissionSource {
	id: string;
	name: string;
	createdAt: string | { millis: number };
	updatedAt: string | { millis: number };
}

export interface SourceKey {
	id: string;
	sourceId: string;
	sourceName: string;
	key: string;
	isValid: boolean;
	createdAt: string | { millis: number };
}

export interface CreateSourceInput {
	name: string;
}

export interface CreateKeyInput {
	submissionSourceId: string;
}

export interface RevokeKeyInput {
	keyId: string;
}

export abstract class ISubmissionSourcesApi {
	abstract listSources(): Promise<SubmissionSource[]>;
	abstract getSource(id: string): Promise<SubmissionSource>;
	abstract createSource(input: CreateSourceInput): Promise<SubmissionSource>;
	abstract deleteSource(id: string): Promise<boolean>;
	abstract createKey(sourceId: string): Promise<{ key: string }>;
	abstract listKeys(sourceId?: string): Promise<SourceKey[]>;
	abstract revokeKey(keyId: string): Promise<boolean>;
}
