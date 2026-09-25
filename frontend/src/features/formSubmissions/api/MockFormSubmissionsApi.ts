import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type {
	CreateSubmissionInput,
	FormSubmission,
	IFormSubmissionsApi,
} from "../types/IFormSubmissionsApi";

const STORAGE_KEY_SUBMISSIONS = "aqui_mock_submissions";

const DEFAULT_SUBMISSIONS: FormSubmission[] = [
	{
		id: "sub-101",
		email: "alex.taylor@example.com",
		sourceId: "src-google-forms",
		createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
		updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
		answers: [
			{
				question: "How satisfied are you with our survey platform?",
				questionType: "rating",
				answerType: "string",
				answer: "5 - Extremely Satisfied",
			},
			{
				question: "What features do you use most frequently?",
				questionType: "multiple-choice",
				answerType: "string[]",
				answer: ["API Webhooks", "Custom Validation", "Form Analytics"],
			},
			{
				question: "Any additional feedback for our engineering team?",
				questionType: "text",
				answerType: "string",
				answer:
					"The integration with Google Forms was remarkably smooth. Would love to see CSV bulk export next!",
			},
		],
	},
	{
		id: "sub-102",
		email: "jordan.lee@acme-corp.com",
		sourceId: "src-google-forms",
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
		updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
		answers: [
			{
				question: "How satisfied are you with our survey platform?",
				questionType: "rating",
				answerType: "string",
				answer: "4 - Satisfied",
			},
			{
				question: "What features do you use most frequently?",
				questionType: "multiple-choice",
				answerType: "string[]",
				answer: ["API Webhooks"],
			},
		],
	},
	{
		id: "sub-103",
		email: "sam.smith@techstartup.io",
		sourceId: "src-website-contact",
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
		updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
		answers: [
			{
				question: "Full Name",
				questionType: "text",
				answerType: "string",
				answer: "Sam Smith",
			},
			{
				question: "Inquiry Category",
				questionType: "dropdown",
				answerType: "string",
				answer: "Enterprise Pricing & Security",
			},
			{
				question: "Matrix Preference Evaluation",
				questionType: "matrix",
				answerType: "string[][]",
				answer: [
					["Support", "High"],
					["Custom Branding", "Medium"],
				],
			},
		],
	},
	{
		id: "sub-104",
		email: "claire.chen@developer.org",
		sourceId: "src-typeform-event",
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
		updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
		answers: [
			{
				question: "Will you attend in-person or virtually?",
				questionType: "single-choice",
				answerType: "string",
				answer: "In-Person (San Francisco)",
			},
			{
				question: "Which workshop tracks are you interested in?",
				questionType: "checkboxes",
				answerType: "string[]",
				answer: [
					"Cloud Native Microservices",
					"Frontend Systems & DI Architecture",
				],
			},
		],
	},
];

@MakeInjectable
export class MockFormSubmissionsApi implements IFormSubmissionsApi {
	public static deps = {};

	public deps: DepsType<typeof MockFormSubmissionsApi.deps>;

	private memorySubmissions: FormSubmission[] = [...DEFAULT_SUBMISSIONS];

	constructor(deps?: DepsType<typeof MockFormSubmissionsApi.deps>) {
		this.deps = deps || {};
	}

	private getStoredSubmissions(): FormSubmission[] {
		if (typeof window !== "undefined") {
			try {
				const item = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
				if (item) return JSON.parse(item);
			} catch {
				// fallback to memory
			}
		}
		return this.memorySubmissions;
	}

	private saveStoredSubmissions(submissions: FormSubmission[]): void {
		this.memorySubmissions = [...submissions];
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(
					STORAGE_KEY_SUBMISSIONS,
					JSON.stringify(submissions),
				);
			} catch {
				// ignore
			}
		}
	}

	async listSubmissions(sourceId?: string): Promise<FormSubmission[]> {
		const submissions = this.getStoredSubmissions();
		if (sourceId) {
			return submissions.filter((s) => s.sourceId === sourceId);
		}
		return [...submissions];
	}

	async getSubmission(id: string): Promise<FormSubmission> {
		const submissions = this.getStoredSubmissions();
		const found = submissions.find((s) => s.id === id);
		if (!found) {
			throw new Error(`Submission ${id} not found`);
		}
		return { ...found };
	}

	async createSubmission(
		input: CreateSubmissionInput,
	): Promise<{ id: string; email: string }> {
		const submissions = this.getStoredSubmissions();
		const newId = `sub-${Math.random().toString(36).substring(2, 9)}`;

		const newSubmission: FormSubmission = {
			id: newId,
			email: input.email,
			answers: input.answers,
			sourceId: "src-google-forms",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		submissions.unshift(newSubmission);
		this.saveStoredSubmissions(submissions);

		return {
			id: newId,
			email: input.email,
		};
	}

	async deleteSubmission(id: string): Promise<boolean> {
		let submissions = this.getStoredSubmissions();
		submissions = submissions.filter((s) => s.id !== id);
		this.saveStoredSubmissions(submissions);
		return true;
	}
}
