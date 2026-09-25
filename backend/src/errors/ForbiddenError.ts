import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
	public override readonly statusCode: number = 403;

	constructor(message: string = "Forbidden", cause?: unknown) {
		super(message, cause);
	}
}
