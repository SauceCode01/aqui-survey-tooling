import { AppError } from "./AppError.js";

export class InternalServerError extends AppError {
	public override readonly statusCode: number = 500;

	constructor(message: string = "Internal server error", cause?: unknown) {
		super(message, cause);
	}
}

export class InternalError extends InternalServerError {}
