import type { Response } from "express";

export type ResponseStatus = "info" | "success" | "redirect" | "fail" | "error";

export type HttpResponse<T> = {
	status: ResponseStatus;
	message: string;
	data?: T;
};

const createHttpResponseObject = <Data = unknown>(
	statusCode: number,
	message: string,
	data?: Data,
): HttpResponse<Data> => {
	// Reject anything outside standard HTTP bounds
	if (statusCode < 100 || statusCode >= 600) {
		throw new Error(`Invalid status code: ${statusCode}`);
	}

	// Attach data only if it is defined to prevent "data: undefined" in JSON
	const payload = data !== undefined ? { data } : {};

	// 1xx: Informational
	if (statusCode >= 100 && statusCode < 200) {
		return { status: "info", message, ...payload };
	}

	// 2xx: Success
	if (statusCode >= 200 && statusCode < 300) {
		return { status: "success", message, ...payload };
	}

	// 3xx: Redirection
	if (statusCode >= 300 && statusCode < 400) {
		return { status: "redirect", message, ...payload };
	}

	// 4xx: Client Errors
	if (statusCode >= 400 && statusCode < 500) {
		return { status: "fail", message, ...payload };
	}

	// 5xx: Server Errors
	return { status: "error", message, ...payload };
};

export const createHttpResponse = <Data = unknown>(p: {
	statusCode: number;
	message: string;
	data?: Data;
	res: Response;
}): Response => {
	const object = createHttpResponseObject(p.statusCode, p.message, p.data);

	return p.res.status(p.statusCode).json(object);
};
