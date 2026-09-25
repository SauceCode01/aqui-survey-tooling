import type { ExpressMiddleware } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { NextFunction, Request, Response } from "express";
import { ProvisionDevice } from "@/features/deviceManagement/useCases/ProvisionDevice.js";
import { ValidateDeviceToken } from "@/features/deviceManagement/useCases/ValidateDeviceToken.js";

declare global {
	namespace Express {
		interface Request {
			context?: {
				deviceId?: string;
				[key: string]: unknown;
			};
		}
	}
}

@MakeInjectable
export class DeviceIdentityMiddleware implements ExpressMiddleware {
	public static deps = {
		validateDeviceToken: ValidateDeviceToken,
		provisionDevice: ProvisionDevice,
	};

	constructor(public deps: DepsType<typeof DeviceIdentityMiddleware.deps>) {}

	handler = async (
		req: Request,
		res: Response,
		next?: NextFunction,
	): Promise<void> => {
		// 1. Extract signedToken from req.cookies.device_id or req.headers['x-device-id']
		let signedToken: string | null | undefined = (
			req as Request & { cookies?: Record<string, string> }
		).cookies?.device_id;

		if (!signedToken && req.headers?.cookie) {
			const match = req.headers.cookie.match(/(?:^|;\s*)device_id=([^;]*)/);
			if (match?.[1]) {
				signedToken = decodeURIComponent(match[1]);
			}
		}

		if (!signedToken && req.headers?.["x-device-id"]) {
			const headerVal = req.headers["x-device-id"];
			signedToken = Array.isArray(headerVal) ? headerVal[0] : headerVal;
		}

		let deviceId: string | null = null;

		// 2. Validate signedToken if present
		if (signedToken) {
			try {
				deviceId = await this.deps.validateDeviceToken.execute({
					signedToken,
				});
			} catch {
				deviceId = null;
			}
		}

		// 3. If validation fails or no token was present, provision a new device
		if (!deviceId) {
			const metadata = {
				userAgent: req.headers?.["user-agent"] ?? "unknown",
				ip:
					req.ip ||
					req.socket?.remoteAddress ||
					req.headers?.["x-forwarded-for"] ||
					"unknown",
				os: req.headers?.["sec-ch-ua-platform"] ?? "unknown",
			};

			const provisionResult = await this.deps.provisionDevice.execute({
				metadata,
			});
			deviceId = provisionResult.deviceId;
			const newSignedToken = provisionResult.signedToken;

			if (typeof res.cookie === "function") {
				res.cookie("device_id", newSignedToken);
			}
			if (typeof res.setHeader === "function") {
				res.setHeader("x-device-id", newSignedToken);
			}
		}

		// 4. Injects { deviceId } into the request context (req.context.deviceId = deviceId)
		if (!req.context) {
			req.context = {};
		}
		req.context.deviceId = deviceId;

		// 5. Calls next()
		if (typeof next === "function") {
			next();
		}
	};
}

export const deviceIdentityMiddleware = DeviceIdentityMiddleware;
