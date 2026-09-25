import type { Time } from "@/shared/time/domain/Time.js";

export interface SubmissionSource {
	id: string;
	createdAt: Time;
	updatedAt: Time;
	name: string;
}

export interface SubmissionSourceCreateDto {
	name: string;
}
