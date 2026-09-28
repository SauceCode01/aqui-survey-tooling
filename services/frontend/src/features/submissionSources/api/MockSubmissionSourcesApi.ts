import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type {
	CreateSourceInput,
	ISubmissionSourcesApi,
	SourceKey,
	SubmissionSource,
} from "../types/ISubmissionSourcesApi";

const STORAGE_KEY_SOURCES = "aqui_mock_sources";
const STORAGE_KEY_KEYS = "aqui_mock_keys";

const DEFAULT_SOURCES: SubmissionSource[] = [
	{
		id: "src-google-forms",
		name: "Google Forms - Customer Feedback",
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
		updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
	},
	{
		id: "src-website-contact",
		name: "Website Contact Us Form",
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
		updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
	},
	{
		id: "src-typeform-event",
		name: "Typeform Event Registration",
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
		updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
	},
];

const DEFAULT_KEYS: SourceKey[] = [
	{
		id: "key-1",
		sourceId: "src-google-forms",
		sourceName: "Google Forms - Customer Feedback",
		key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key-google-forms-active",
		isValid: true,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
	},
	{
		id: "key-2",
		sourceId: "src-google-forms",
		sourceName: "Google Forms - Customer Feedback",
		key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key-google-forms-revoked",
		isValid: false,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
	},
	{
		id: "key-3",
		sourceId: "src-website-contact",
		sourceName: "Website Contact Us Form",
		key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key-website-active",
		isValid: true,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
	},
	{
		id: "key-4",
		sourceId: "src-typeform-event",
		sourceName: "Typeform Event Registration",
		key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-key-typeform-active",
		isValid: true,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
	},
];

@MakeInjectable
export class MockSubmissionSourcesApi implements ISubmissionSourcesApi {
	public static deps = {};

	public deps: DepsType<typeof MockSubmissionSourcesApi.deps>;

	private memorySources: SubmissionSource[] = [...DEFAULT_SOURCES];
	private memoryKeys: SourceKey[] = [...DEFAULT_KEYS];

	constructor(deps?: DepsType<typeof MockSubmissionSourcesApi.deps>) {
		this.deps = deps || {};
	}

	private getStoredSources(): SubmissionSource[] {
		if (typeof window !== "undefined") {
			try {
				const item = localStorage.getItem(STORAGE_KEY_SOURCES);
				if (item) return JSON.parse(item);
			} catch {
				// fallback to memory
			}
		}
		return this.memorySources;
	}

	private saveStoredSources(sources: SubmissionSource[]): void {
		this.memorySources = [...sources];
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(sources));
			} catch {
				// ignore
			}
		}
	}

	private getStoredKeys(): SourceKey[] {
		if (typeof window !== "undefined") {
			try {
				const item = localStorage.getItem(STORAGE_KEY_KEYS);
				if (item) return JSON.parse(item);
			} catch {
				// fallback to memory
			}
		}
		return this.memoryKeys;
	}

	private saveStoredKeys(keys: SourceKey[]): void {
		this.memoryKeys = [...keys];
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(STORAGE_KEY_KEYS, JSON.stringify(keys));
			} catch {
				// ignore
			}
		}
	}

	async listSources(): Promise<SubmissionSource[]> {
		return [...this.getStoredSources()];
	}

	async getSource(id: string): Promise<SubmissionSource> {
		const sources = this.getStoredSources();
		const found = sources.find((s) => s.id === id);
		if (!found) {
			throw new Error(`Submission source ${id} not found`);
		}
		return { ...found };
	}

	async createSource(input: CreateSourceInput): Promise<SubmissionSource> {
		const sources = this.getStoredSources();
		const newSource: SubmissionSource = {
			id: `src-${Math.random().toString(36).substring(2, 9)}`,
			name: input.name,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		sources.unshift(newSource);
		this.saveStoredSources(sources);
		return { ...newSource };
	}

	async deleteSource(id: string): Promise<boolean> {
		let sources = this.getStoredSources();
		sources = sources.filter((s) => s.id !== id);
		this.saveStoredSources(sources);

		let keys = this.getStoredKeys();
		keys = keys.filter((k) => k.sourceId !== id);
		this.saveStoredKeys(keys);

		return true;
	}

	async createKey(sourceId: string): Promise<{ key: string }> {
		const source = await this.getSource(sourceId);
		const keyId = `key-${Math.random().toString(36).substring(2, 9)}`;
		const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${keyId}.${Math.random().toString(36).substring(2, 12)}`;

		const newKey: SourceKey = {
			id: keyId,
			sourceId: source.id,
			sourceName: source.name,
			key: token,
			isValid: true,
			createdAt: new Date().toISOString(),
		};

		const keys = this.getStoredKeys();
		keys.unshift(newKey);
		this.saveStoredKeys(keys);

		return { key: token };
	}

	async listKeys(sourceId?: string): Promise<SourceKey[]> {
		const keys = this.getStoredKeys();
		if (sourceId) {
			return keys.filter((k) => k.sourceId === sourceId);
		}
		return [...keys];
	}

	async revokeKey(keyId: string): Promise<boolean> {
		const keys = this.getStoredKeys();
		const target = keys.find((k) => k.id === keyId);
		if (target) {
			target.isValid = false;
			this.saveStoredKeys(keys);
			return true;
		}
		return false;
	}
}
