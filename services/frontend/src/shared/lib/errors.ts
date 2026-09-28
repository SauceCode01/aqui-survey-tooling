/**
 * Strongly typed HTTP API error representing non-2xx responses from backend services.
 */
export class ApiError extends Error {
	public readonly status: number;
	public readonly statusText: string;
	public readonly code?: string;
	public readonly details?: unknown;

	constructor(params: {
		message: string;
		status: number;
		statusText: string;
		code?: string;
		details?: unknown;
	}) {
		super(params.message);
		this.name = "ApiError";
		this.status = params.status;
		this.statusText = params.statusText;
		this.code = params.code;
		this.details = params.details;

		Object.setPrototypeOf(this, ApiError.prototype);
	}

	get isClientError(): boolean {
		return this.status >= 400 && this.status < 500;
	}

	get isServerError(): boolean {
		return this.status >= 500;
	}

	get isNotFound(): boolean {
		return this.status === 404;
	}

	get isUnauthorized(): boolean {
		return this.status === 401;
	}

	get isForbidden(): boolean {
		return this.status === 403;
	}

	get isValidationError(): boolean {
		return this.status === 422 || this.status === 400;
	}
}
