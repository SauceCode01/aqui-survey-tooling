import type { Time } from "@/shared/time/domain/Time.js";

export interface FormSubmission {
	id: string;
	createdAt: Time;
	updatedAt: Time;
	email: string;
	answers: any;
	sourceId: string;
}

export interface FormSubmissionCreatDTO
	extends Omit<FormSubmission, "id" | "createdAt" | "updatedAt" | "sourceId"> {}
