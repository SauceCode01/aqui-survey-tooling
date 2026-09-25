import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { FirebaseClient } from "@/infrastructure/FirebaseClient.js";
import { Clock } from "@/shared/time/Clock.js";
import type { FormSubmission } from "../domain/FormSubmission.js";
import type { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";

@MakeInjectable
export class FirebaseFormSubmissionRepository
	implements IFormSubmissionRepository
{
	public static deps = {
		fbClient: FirebaseClient,
		clock: Clock,
	};

	constructor(
		public deps: DepsType<typeof FirebaseFormSubmissionRepository.deps>,
	) {}

	async GetFormSubmissionById(input: {
		formSubmissionId: string;
	}): Promise<{ formSubmission: FormSubmission }> {
		throw new Error("not implemented");
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
		throw new Error("not implemented");
	}

	async CreateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }> {
		const { formSubmission } = input;
		const collectionName = "formSubmissions";
		const docId = formSubmission.id;

		// Use the FirebaseClient to create the document with a custom ID
		await this.deps.fbClient.createWithCustomId(collectionName, docId, {
			email: formSubmission.email,
			answers: formSubmission.answers,
			createdAt: this.deps.clock.toIso(formSubmission.createdAt),
			updatedAt: this.deps.clock.toIso(formSubmission.updatedAt),
		});

		return { formSubmission };
	}

	async UpdateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }> {
		throw new Error("not implemented");
	}

	async DeleteFormSubmission(input: {
		formSubmissionId: string;
	}): Promise<{ success: boolean }> {
		throw new Error("not implemented");
	}
}
