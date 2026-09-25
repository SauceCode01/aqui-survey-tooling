import { AppError } from "./AppError.js";

export class NotFoundError extends AppError {
	public override readonly statusCode: number = 404;

	constructor(message: string = "Resource not found", cause?: unknown) {
		super(message, cause);
	}
}
