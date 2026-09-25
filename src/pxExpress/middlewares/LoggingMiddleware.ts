import { ILogger } from "@solid-stack/agnos";
import type { ExpressMiddleware } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { NextFunction, Request, Response } from "express";

@MakeInjectable
export class LoggingMiddleware implements ExpressMiddleware {
	public static deps = {
		logger: ILogger,
	};

	constructor(public deps: DepsType<typeof LoggingMiddleware.deps>) {}

	handler = async (req: Request, res: Response, next?: NextFunction) => {
		const startTime = Date.now();
		const method = req.method;
		// Fallback to req.url if originalUrl (Express) is unavailable
		const path = req.originalUrl || req.url;

		// this.logger.info(`[REQUEST STARTED] ${method} ${path}`);

		// Hook into the response finish event to calculate duration and log status
		if (typeof res.on === "function") {
			res.on("finish", () => {
				const duration = Date.now() - startTime;
				const status = res.statusCode;

				if (status >= 500) {
					this.deps.logger.error(
						`[REQUEST ERROR] ${method} ${path} - Status: ${status} - ${duration}ms`,
					);
				} else if (status >= 400) {
					this.deps.logger.warn(
						`[REQUEST REJECTED] ${method} ${path} - Status: ${status} - ${duration}ms`,
					);
				} else {
					this.deps.logger.info(
						`[REQUEST COMPLETED] ${method} ${path} - Status: ${status} - ${duration}ms`,
					);
				}
			});
		}

		// Pass control to the next middleware or route handler if 'next' is provided
		if (typeof next === "function") {
			next();
		}
	};
}
