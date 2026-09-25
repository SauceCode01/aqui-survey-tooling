import { AgnosError, ILogger } from "@solid-stack/agnos";
import type { ExpressErrorHandler } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { ErrorRequestHandler } from "express";
import { AppError } from "@/errors/index.js";

@MakeInjectable
export class GlobalErrorHandler implements ExpressErrorHandler {
	public static deps = { logger: ILogger };
	constructor(public deps: DepsType<typeof GlobalErrorHandler.deps>) {}

	public handler: ErrorRequestHandler = async (err, _req, res, _next) => {
		this.deps.logger.error(err);
		if (AgnosError.isAgnosError(err)) {
			return res.status(err.statusCode || 500).json({
				status: "error",
				message: err.message || err.details || "An error occurred",
				error: {
					type: err.name,
					details: err.details ?? err.message,
				},
			});
		}
		if (
			AppError.isAppError(err) ||
			(err && typeof err.statusCode === "number")
		) {
			return res.status(err.statusCode || 500).json({
				status: "error",
				message: err.message || "An error occurred",
				error: {
					type: err.name || "AppError",
					details: err.details ?? err.message,
				},
			});
		}
		return res.status(500).json({
			status: "error",
			message: "Internal server error",
			error: {
				type: "InternalError",
				details: "An unexpected error occurred",
			},
		});
	};
}
