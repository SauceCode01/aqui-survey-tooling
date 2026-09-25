/**
 * Environment configuration for frontend application.
 * Manages configuration for API switching (Mock standalone vs Real backend).
 */

export interface AppEnv {
	NEXT_PUBLIC_USE_MOCKS: string;
	NEXT_PUBLIC_BASE_PATH: string;
	NEXT_PUBLIC_BACKEND_EXTERNAL_URL: string;
	NEXT_PUBLIC_FRONTEND_EXTERNAL_URL: string;
	NEXT_PUBLIC_GATEWAY_EXTERNAL_URL: string;
}

function resolveUseMocks(): string {
	// If explicitly set via environment variable
	if (typeof process !== "undefined" && process.env) {
		if (process.env.NEXT_PUBLIC_USE_MOCKS !== undefined) {
			return process.env.NEXT_PUBLIC_USE_MOCKS;
		}
		// In tests default to mocks unless explicitly specified
		if (process.env.NODE_ENV === "test") {
			return "true";
		}
		// In production or integrated infra mode, default to real API
		if (
			process.env.INFRA_MODE === "integrated" ||
			process.env.NODE_ENV === "production"
		) {
			return "false";
		}
	}

	// In browser, check localStorage override if user toggled in dev toolbar
	if (typeof window !== "undefined") {
		const manualOverride = localStorage.getItem("ssd_use_mocks");
		if (manualOverride !== null) {
			return manualOverride;
		}
	}

	// Default to true for standalone dev if no live backend configured
	return "true";
}

export const env: AppEnv = {
	NEXT_PUBLIC_USE_MOCKS: resolveUseMocks(),
	NEXT_PUBLIC_BASE_PATH:
		process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || "",
	NEXT_PUBLIC_BACKEND_EXTERNAL_URL:
		process.env.NEXT_PUBLIC_BACKEND_EXTERNAL_URL ||
		process.env.BACKEND_EXTERNAL_URL ||
		"http://localhost:3000/api",
	NEXT_PUBLIC_FRONTEND_EXTERNAL_URL:
		process.env.NEXT_PUBLIC_FRONTEND_EXTERNAL_URL ||
		process.env.FRONTEND_EXTERNAL_URL ||
		"http://localhost:3000/web",
	NEXT_PUBLIC_GATEWAY_EXTERNAL_URL:
		process.env.NEXT_PUBLIC_GATEWAY_EXTERNAL_URL ||
		process.env.GATEWAY_EXTERNAL_URL ||
		"http://localhost:3000",
};

/**
 * Returns whether mock API mode is currently active.
 */
export function isMockMode(): boolean {
	if (typeof window !== "undefined") {
		const manualOverride = localStorage.getItem("ssd_use_mocks");
		if (manualOverride !== null) {
			return manualOverride === "true";
		}
	}
	return env.NEXT_PUBLIC_USE_MOCKS === "true";
}

/**
 * Programmatically toggle mock mode in development and refresh.
 */
export function setMockMode(useMocks: boolean): void {
	if (typeof window !== "undefined") {
		localStorage.setItem("ssd_use_mocks", useMocks ? "true" : "false");
		window.location.reload();
	}
}
