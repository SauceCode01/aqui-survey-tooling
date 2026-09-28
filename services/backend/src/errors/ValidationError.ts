import { BadRequestError } from "./BadRequestError.js";

export class ValidationError extends BadRequestError {
	public override readonly details?: unknown;

	constructor(
		message: string = "Validation failed",
		details?: unknown,
		cause?: unknown,
	) {
		super(message, cause);
		this.details = details;
	}
}
