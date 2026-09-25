export class AppError extends Error {
	public readonly statusCode: number = 500;
	public readonly details?: unknown;

	constructor(message?: string, cause?: unknown) {
		super();

		this.message = message || "An error occurred";
		this.cause = cause || null;

		// Set the prototype for instanceof checks
		Object.setPrototypeOf(this, new.target.prototype);

		// Build the dot-notation name chain dynamically
		this.name = this.getConstructorChain(new.target);
	}

	public static isAppError(err: unknown): err is AppError {
		return (
			err instanceof AppError ||
			(err instanceof Error &&
				(err.name.startsWith("AppError") ||
					typeof (err as { statusCode?: unknown }).statusCode === "number"))
		);
	}

	private getConstructorChain(target: object & { name?: string }): string {
		const chain: string[] = [];
		let current: (object & { name?: string }) | null = target;

		// Walk up the prototype chain until we hit the native Error class
		while (current && current !== Error && current.name) {
			chain.unshift(current.name); // Add to the front to keep root-to-leaf order
			current = Object.getPrototypeOf(current);
		}

		return chain.join(".");
	}
}
