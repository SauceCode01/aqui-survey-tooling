export const routes = {
	home: () => "/",
	dashboard: () => "/",
	sources: {
		list: () => "/sources",
		detail: (sourceId: string) => `/sources/${encodeURIComponent(sourceId)}`,
	},
	submissions: {
		list: (sourceId?: string) =>
			sourceId
				? `/submissions?sourceId=${encodeURIComponent(sourceId)}`
				: "/submissions",
	},
	health: () => "/api/health",
};
