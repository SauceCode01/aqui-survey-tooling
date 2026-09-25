export type FetchFn = (
	url: string,
	options?: {
		body?: string;
	},
) => Promise<Response>;
