import type { Time } from "@/shared/time/domain/Time.js";

export interface QuestionGeneral {
	question: string;
	questionType: string; 
} 

export interface StringAnswer extends QuestionGeneral { 
	answerType: "string";
	answer: string;
}

export interface StringArrAnswer extends QuestionGeneral {
	answerType: "string[]";
	answer: string[];
}

export interface StringArrArrAnswer extends QuestionGeneral {
	answerType: "string[][]";
	answer: string[][];
}

export type QuestionAnswer = StringAnswer | StringArrAnswer | StringArrArrAnswer;


export interface FormSubmission {
	id: string;
	createdAt: Time;
	updatedAt: Time;
	email: string;
	answers: QuestionAnswer[];
	sourceId: string;
}

export interface FormSubmissionCreatDTO
	extends Omit<FormSubmission, "id" | "createdAt" | "updatedAt" | "sourceId"> {}
