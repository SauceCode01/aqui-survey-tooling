import type { FetchFn } from "../interfaces/FetchFn.js";

export const makeFetchFn = (): FetchFn => {
	return async (
		url: string,
		options?: {
			body?: string;
		},
	): Promise<Response> => {
		const result = await fetch(url, options);
		return result;
	};
};
