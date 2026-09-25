import { config } from "./config";
import { ApiError } from "./errors";
import { isOffline } from "./network";

export interface ApiCallLog {
	id: string;
	timestamp: string;
	method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
	url: string;
	status: number;
	statusText: string;
	durationMs: number;
	requestPayload?: unknown;
	responsePayload?: unknown;
	isError?: boolean;
}

export type LogListener = (log: ApiCallLog) => void;
const logListeners = new Set<LogListener>();

export function subscribeApiLogs(listener: LogListener): () => void {
	if (typeof window === "undefined") {
		return () => {};
	}
	logListeners.add(listener);
	return () => {
		logListeners.delete(listener);
	};
}

function broadcastLog(log: ApiCallLog): void {
	if (typeof window === "undefined") return;
	for (const listener of logListeners) {
		try {
			listener(log);
		} catch (err) {
			console.error("Error in API log listener:", err);
		}
	}
}

/**
 * Returns the resolved API base URL.
 * In the browser, relative '/api' is used by default to route seamlessly through the Gateway.
 */
export function getApiBaseUrl(): string {
	if (typeof window !== "undefined") {
		return "/api";
	}
	return config.backendExternalUrl || "http://localhost:3000/api";
}

export interface CallOptions extends Omit<RequestInit, "signal"> {
	signal?: AbortSignal;
	timeoutMs?: number;
}

/**
 * Generic HTTP client method. Zero domain knowledge.
 * Handles baseURL resolution, timeout cancellation, error parsing into ApiError, and telemetry logging.
 */
export async function callApi<T>(
	endpoint: string,
	options: CallOptions = {},
): Promise<{ data: T; log: ApiCallLog }> {
	const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
	const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
	const fullUrl = `${baseUrl}${cleanEndpoint}`;

	if (isOffline()) {
		const method = (
			options.method || "GET"
		).toUpperCase() as ApiCallLog["method"];
		let requestPayload: unknown;
		if (options.body && typeof options.body === "string") {
			try {
				requestPayload = JSON.parse(options.body);
			} catch {
				requestPayload = options.body;
			}
		} else if (options.body) {
			requestPayload = options.body;
		}

		const errorLog: ApiCallLog = {
			id: Math.random().toString(36).substring(2, 9),
			timestamp: new Date().toLocaleTimeString(),
			method,
			url: cleanEndpoint,
			status: 0,
			statusText: "Offline",
			durationMs: 0,
			requestPayload,
			responsePayload: {
				error: "Network unavailable: device is offline.",
			},
			isError: true,
		};
		broadcastLog(errorLog);
		throw new ApiError({
			message: "Network unavailable: device is offline.",
			status: 0,
			statusText: "Offline",
		});
	}

	const { timeoutMs = 15000, signal: callerSignal, ...fetchOptions } = options;

	// Setup timeout signal combined with any caller cancellation signal
	const controller = new AbortController();
	const timeoutId = setTimeout(() => {
		controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
	}, timeoutMs);

	if (callerSignal) {
		callerSignal.addEventListener("abort", () => {
			controller.abort(callerSignal.reason);
		});
	}

	const startTime = performance.now();
	const method = (
		fetchOptions.method || "GET"
	).toUpperCase() as ApiCallLog["method"];
	let requestPayload: unknown;

	if (fetchOptions.body && typeof fetchOptions.body === "string") {
		try {
			requestPayload = JSON.parse(fetchOptions.body);
		} catch {
			requestPayload = fetchOptions.body;
		}
	} else if (fetchOptions.body) {
		requestPayload = fetchOptions.body;
	}

	let status = 0;
	let statusText = "Network Error";
	let responsePayload: unknown;
	let _isError = false;

	try {
		const res = await fetch(fullUrl, {
			...fetchOptions,
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				...(fetchOptions.headers || {}),
			},
		});

		status = res.status;
		statusText = res.statusText || (res.ok ? "OK" : "Error");

		const text = await res.text();
		try {
			responsePayload = text ? JSON.parse(text) : null;
		} catch {
			responsePayload = text;
		}

		if (!res.ok) {
			_isError = true;
			const errPayload = responsePayload as
				| { message?: string; error?: { message?: string; code?: string } }
				| undefined;
			const msg =
				errPayload?.message ||
				errPayload?.error?.message ||
				`Request failed with status ${status}`;
			const code = errPayload?.error?.code;

			throw new ApiError({
				message: msg,
				status,
				statusText,
				code,
				details: responsePayload,
			});
		}

		const log: ApiCallLog = {
			id: Math.random().toString(36).substring(2, 9),
			timestamp: new Date().toLocaleTimeString(),
			method,
			url: cleanEndpoint,
			status,
			statusText,
			durationMs: Math.round(performance.now() - startTime),
			requestPayload,
			responsePayload,
			isError: false,
		};
		broadcastLog(log);

		return {
			data: responsePayload as T,
			log,
		};
	} catch (err: unknown) {
		_isError = true;
		const durationMs = Math.round(performance.now() - startTime);

		const isApiError = err instanceof ApiError;
		const errorLog: ApiCallLog = {
			id: Math.random().toString(36).substring(2, 9),
			timestamp: new Date().toLocaleTimeString(),
			method,
			url: cleanEndpoint,
			status: isApiError ? err.status : status || 500,
			statusText: isApiError ? err.statusText : statusText || "Failed",
			durationMs,
			requestPayload,
			responsePayload: responsePayload || {
				error: err instanceof Error ? err.message : "Unknown error",
			},
			isError: true,
		};
		broadcastLog(errorLog);

		if (isApiError) {
			throw err;
		}

		throw new ApiError({
			message: err instanceof Error ? err.message : "Network request failed",
			status: status || 500,
			statusText: statusText || "Failed",
			details: err,
		});
	} finally {
		clearTimeout(timeoutId);
	}
}
