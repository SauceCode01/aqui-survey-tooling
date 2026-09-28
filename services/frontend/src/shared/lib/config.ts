const defaultHostUrl = "http://localhost:3000";
const basePath =
	process.env.NEXT_PUBLIC_BASE_PATH ||
	process.env.FRONTEND_BASE_PATH ||
	process.env.BASE_PATH ||
	"";

export const config = {
	basePath,
	frontendExternalUrl:
		process.env.NEXT_PUBLIC_FRONTEND_EXTERNAL_URL ||
		process.env.FRONTEND_EXTERNAL_URL ||
		(basePath ? `${defaultHostUrl}${basePath}` : defaultHostUrl),
	backendExternalUrl:
		process.env.NEXT_PUBLIC_BACKEND_EXTERNAL_URL ||
		process.env.BACKEND_EXTERNAL_URL ||
		`${defaultHostUrl}/api`,
	gatewayExternalUrl:
		process.env.NEXT_PUBLIC_GATEWAY_EXTERNAL_URL ||
		process.env.GATEWAY_EXTERNAL_URL ||
		defaultHostUrl,
};
