import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
	public override readonly statusCode: number = 409;

	constructor(message: string = "Resource conflict", cause?: unknown) {
		super(message, cause);
	}
}

export class ResourceConflictError extends ConflictError {
	constructor(message: string = "Resource conflict", cause?: unknown) {
		super(message, cause);
	}
}
