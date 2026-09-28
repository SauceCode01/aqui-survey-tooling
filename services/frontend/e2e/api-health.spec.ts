import { expect, test } from "@playwright/test";

test.describe("API Health Endpoint (E2E)", () => {
	test("GET /api/health returns status ok", async ({ request }) => {
		const rawBasePath = (
			process.env.FRONTEND_BASE_PATH ||
			process.env.BASE_PATH ||
			process.env.NEXT_PUBLIC_BASE_PATH ||
			""
		)
			.replace(/^["']|["']$/g, "")
			.trim();
		const basePath =
			rawBasePath &&
			rawBasePath !== "/" &&
			rawBasePath !== "none" &&
			rawBasePath !== "false"
				? rawBasePath.startsWith("/")
					? rawBasePath.replace(/\/+$/, "")
					: `/${rawBasePath.replace(/\/+$/, "")}`
				: "";

		const endpoint = `${basePath}/api/health`;
		const response = await request.get(endpoint);
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data.status).toBe("ok");
		expect(data.service).toBe("nextjs-app");
		expect(data.timestamp).toBeDefined();
	});
});
