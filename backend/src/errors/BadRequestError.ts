import { AppError } from "./AppError.js";

export class BadRequestError extends AppError {
	public override readonly statusCode: number = 400;

	constructor(message: string = "Bad request", cause?: unknown) {
		super(message, cause);
	}
}
