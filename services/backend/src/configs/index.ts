import { resolve } from "node:path";
import dotenv from "dotenv";
import { AppError } from "@/errors/AppError.js";

export interface AppEnvironment {
	readonly env: "dev" | "prod" | "test" | "e2e" | "sandbox";
	readonly execMode: "dev" | "prod" | "test";
	readonly infraMode: "isolated" | "integrated";
	readonly px: string;
	readonly http: {
		readonly port: number;
	};
	readonly database: {
		readonly url: string;
	};
	readonly cli: {
		readonly logLevel: "info" | "log" | "warn" | "error";
	};
	readonly otp: {
		readonly staticOtp: string;
	};
	readonly jwt: {
		readonly secret: string;
	};
}

export function loadEnvironment(): AppEnvironment {
	const rawEnv =
		process.env.EXEC_MODE ??
		process.env.ENVIRONMENT ??
		process.env.APP_ENV ??
		process.env.NODE_ENV ??
		"dev";
	const normalizedEnv =
		rawEnv === "development"
			? "dev"
			: rawEnv === "production"
				? "prod"
				: rawEnv;
	const execMode =
		normalizedEnv === "prod"
			? "prod"
			: normalizedEnv === "test"
				? "test"
				: "dev";
	const infraMode =
		process.env.INFRA_MODE === "integrated" ? "integrated" : "isolated";

	// 0. Automatically load exactly one specific environment file
	if (process.env.ENV_FILE) {
		dotenv.config({ path: resolve(process.cwd(), process.env.ENV_FILE) });
	} else if (normalizedEnv === "dev") {
		dotenv.config({ path: resolve(process.cwd(), ".env.dev") });
	} else if (normalizedEnv === "test") {
		dotenv.config({ path: resolve(process.cwd(), ".env.test") });
	} else if (normalizedEnv === "e2e" || normalizedEnv === "sandbox") {
		dotenv.config({ path: resolve(process.cwd(), ".env.e2e") });
	} else if (normalizedEnv === "prod") {
		dotenv.config({ path: resolve(process.cwd(), ".env.prod") });
	} else {
		dotenv.config({ path: resolve(process.cwd(), ".env") });
	}

	const env: Record<string, string | undefined> = process.env;
	const errors: string[] = [];

	// 1. Validate Environment
	if (!["dev", "prod", "test", "e2e", "sandbox"].includes(normalizedEnv)) {
		errors.push(
			`ENVIRONMENT must be one of "dev" | "prod" | "test" | "e2e" | "sandbox", got: "${rawEnv}"`,
		);
	}

	// 2. Validate Presentation Adapter
	const px = env.PRESENTATION ?? "express";
	if (!px || typeof px !== "string") {
		errors.push('PRESENTATION must be a valid string (e.g. "express").');
	}

	// 3. Validate Port (Must be integer between 1 and 65535)
	const rawPort = env.PORT ?? env.TEMPLATE_API_PORT ?? env.HTTP_PORT ?? "3000";
	const port = Number(rawPort);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		errors.push(
			`HTTP_PORT / PORT must be a valid port integer (1-65535), got: "${rawPort}"`,
		);
	}

	// 4. Validate Database URL
	const databaseUrl = env.DATABASE_URL ?? "memory://test";

	// 5. Static OTP for e2e/sandbox
	const staticOtp = env.STATIC_OTP ?? env.TEST_OTP ?? "123456";

	if (errors.length > 0) {
		throw new Error(
			`[Config Initialization Error]:\n  - ${errors.join("\n  - ")}`,
		);
	}

	return Object.freeze({
		env: normalizedEnv as AppEnvironment["env"],
		execMode,
		infraMode,
		http: Object.freeze({ port }),
		database: Object.freeze({ url: databaseUrl }),
		cli: Object.freeze({ logLevel: "info" as const }),
		px,
		otp: Object.freeze({ staticOtp }),
		jwt: Object.freeze({
			secret:
				env.JWT_SECRET ||
				(() => {
					throw new AppError("JWT secret is required");
				})(),
		}),
	});
}
