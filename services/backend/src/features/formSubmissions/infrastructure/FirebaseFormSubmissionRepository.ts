import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { AppError } from "@/errors/AppError.js";
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
		const doc = await this.deps.fbClient.getDocumentById<{
			email: string;
			sourceId: string;
			answers: FormSubmission["answers"];
			createdAt: string;
			updatedAt: string;
		}>("formSubmissions", input.formSubmissionId);
		if (!doc) {
			throw new AppError(
				`Form submission with id ${input.formSubmissionId} not found`,
				404,
			);
		}
		const formSubmission: FormSubmission = {
			id: doc.id,
			email: doc.email,
			sourceId: doc.sourceId || "",
			answers: doc.answers || [],
			createdAt: this.deps.clock.fromIso(doc.createdAt),
			updatedAt: this.deps.clock.fromIso(doc.updatedAt),
		};
		return { formSubmission };
	}

	async ListFormSubmissions(input?: {
		page?: number | undefined;
		limit?: number | undefined;
		sourceId?: string | undefined;
	}): Promise<{
		formSubmissions: FormSubmission[];
		total?: number | undefined;
		page?: number | undefined;
		limit?: number | undefined;
	}> {
		let query: FirebaseFirestore.Query =
			this.deps.fbClient.db.collection("formSubmissions");
		if (input?.sourceId) {
			query = query.where("sourceId", "==", input.sourceId);
		}
		const snapshot = await query.get();
		const formSubmissions: FormSubmission[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				email: data.email,
				sourceId: (data.sourceId as string) || "",
				answers: data.answers || [],
				createdAt: this.deps.clock.fromIso(data.createdAt as string),
				updatedAt: this.deps.clock.fromIso(data.updatedAt as string),
			};
		});
		return {
			formSubmissions,
			total: formSubmissions.length,
			page: input?.page ?? 1,
			limit: input?.limit ?? formSubmissions.length,
		};
	}

	async CreateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }> {
		const { formSubmission } = input;
		const collectionName = "formSubmissions";
		const docId = formSubmission.id;

		await this.deps.fbClient.createWithCustomId(collectionName, docId, {
			email: formSubmission.email,
			sourceId: formSubmission.sourceId,
			answers: formSubmission.answers,
			createdAt: this.deps.clock.toIso(formSubmission.createdAt),
			updatedAt: this.deps.clock.toIso(formSubmission.updatedAt),
		});

		return { formSubmission };
	}

	async UpdateFormSubmission(input: {
		formSubmission: FormSubmission;
	}): Promise<{ formSubmission: FormSubmission }> {
		await this.deps.fbClient.db
			.collection("formSubmissions")
			.doc(input.formSubmission.id)
			.set(
				{
					email: input.formSubmission.email,
					sourceId: input.formSubmission.sourceId,
					answers: input.formSubmission.answers,
					updatedAt: this.deps.clock.toIso(input.formSubmission.updatedAt),
				},
				{ merge: true },
			);
		return { formSubmission: input.formSubmission };
	}

	async DeleteFormSubmission(input: {
		formSubmissionId: string;
	}): Promise<{ success: boolean }> {
		await this.deps.fbClient.db
			.collection("formSubmissions")
			.doc(input.formSubmissionId)
			.delete();
		return { success: true };
	}
}
