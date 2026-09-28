import { AppError } from "./AppError.js";

export class UnauthorizedError extends AppError {
	public override readonly statusCode: number = 401;

	constructor(message: string = "Unauthorized", cause?: unknown) {
		super(message, cause);
	}
}
