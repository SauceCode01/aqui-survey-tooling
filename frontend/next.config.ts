import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

// Automatically load environment file matching active NODE_ENV if present (.env.prod, .env.dev, .env.test)
const activeEnv =
	process.env.NODE_ENV === "production"
		? "prod"
		: process.env.NODE_ENV === "test"
			? "test"
			: "dev";
const envFile = process.env.ENV_FILE || `.env.${activeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath });
}

const sanitizeBasePath = (path?: string): string | undefined => {
	if (!path) return undefined;
	const cleaned = path.replace(/^["']|["']$/g, "").trim();
	if (!cleaned || cleaned === "/" || cleaned === "none" || cleaned === "false")
		return undefined;
	return cleaned.startsWith("/")
		? cleaned.replace(/\/+$/, "")
		: `/${cleaned.replace(/\/+$/, "")}`;
};

// When FRONTEND_BASE_PATH or BASE_PATH is set (e.g. by gateway/root ecosystem), use it.
// When running standalone (e.g. `make dev` in /frontend), they are unset and it runs at root /.
const basePath = sanitizeBasePath(
	process.env.FRONTEND_BASE_PATH || process.env.BASE_PATH,
);

const defaultHostUrl = "http://localhost:3000";
const frontendExternalUrl =
	process.env.FRONTEND_EXTERNAL_URL ||
	process.env.NEXT_PUBLIC_FRONTEND_EXTERNAL_URL ||
	(basePath ? `${defaultHostUrl}${basePath}` : defaultHostUrl);

const backendExternalUrl =
	process.env.BACKEND_EXTERNAL_URL ||
	process.env.NEXT_PUBLIC_BACKEND_EXTERNAL_URL ||
	`${defaultHostUrl}/api`;

const gatewayExternalUrl =
	process.env.GATEWAY_EXTERNAL_URL ||
	process.env.NEXT_PUBLIC_GATEWAY_EXTERNAL_URL ||
	defaultHostUrl;

const nextConfig: NextConfig = {
	output: "standalone",
	reactCompiler: true,
	basePath,
	env: {
		NEXT_PUBLIC_BASE_PATH: basePath || "",
		NEXT_PUBLIC_FRONTEND_EXTERNAL_URL: frontendExternalUrl,
		NEXT_PUBLIC_BACKEND_EXTERNAL_URL: backendExternalUrl,
		NEXT_PUBLIC_GATEWAY_EXTERNAL_URL: gatewayExternalUrl,
	},
	allowedDevOrigins: [
		"app",
		"app:3000",
		"app.local",
		"app.local:3000",
		"frontend",
		"frontend:3000",
		"gateway",
		"gateway:80",
		"gateway:3000",
		"nextjs-app",
		"nextjs-app:3000",
		"internal-pmis-web-nextjs",
		"internal-pmis-web-nextjs:3000",
		"localhost",
		"localhost:3000",
		"127.0.0.1",
		"127.0.0.1:3000",
		"0.0.0.0",
	],
};

export default nextConfig;
