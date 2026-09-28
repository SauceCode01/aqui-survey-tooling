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

export type QuestionAnswer =
	| StringAnswer
	| StringArrAnswer
	| StringArrArrAnswer;

export interface FormSubmission {
	id: string;
	email: string;
	answers: QuestionAnswer[];
	sourceId: string;
	createdAt: string | { millis: number };
	updatedAt: string | { millis: number };
}

export interface CreateSubmissionInput {
	email: string;
	answers: QuestionAnswer[];
	sourceKey: string;
}

export abstract class IFormSubmissionsApi {
	abstract listSubmissions(sourceId?: string): Promise<FormSubmission[]>;
	abstract getSubmission(id: string): Promise<FormSubmission>;
	abstract createSubmission(
		input: CreateSubmissionInput,
	): Promise<{ id: string; email: string }>;
	abstract deleteSubmission(id: string): Promise<boolean>;
}
