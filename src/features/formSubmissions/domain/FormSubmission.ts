import type { Time } from "@/shared/time/domain/Time.js";

export interface FormSubmission {
	id: string;
	createdAt: Time;
	updatedAt: Time;
	email: string;
	answers: any;
}

export interface FormSubmissionCreatDTO
	extends Omit<FormSubmission, "id" | "createdAt" | "updatedAt"> {}
