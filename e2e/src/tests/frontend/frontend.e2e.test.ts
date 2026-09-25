import { beforeAll, describe, expect, it } from "vitest";
import { loadEnvironment } from "@/configs/index.js";
import { waitForService } from "@/utils/waitForService.js";

const env = loadEnvironment();

describe("Frontend Web E2E Suite (via Gateway Instance)", () => {
	beforeAll(async () => {
		console.log(`\n========================================`);
		console.log(`Testing Frontend Web via Gateway Instance:`);
		console.log(`  - Gateway URL:  ${env.gatewayUrl}`);
		console.log(`  - Gateway Web:  ${env.gatewayUrl}/web`);
		console.log(`========================================\n`);

		await Promise.all([
			waitForService(
				`${env.gatewayUrl}/web/api/health`,
				"Frontend API (via Gateway)",
				30000,
			),
			waitForService(
				`${env.gatewayUrl}/web`,
				"Frontend Web Page (via Gateway)",
				30000,
			),
		]);
	});

	describe("Frontend API Route (/web/api/health via Gateway)", () => {
		it("returns status ok and valid service metadata through Gateway", async () => {
			const res = await fetch(`${env.gatewayUrl}/web/api/health`);
			expect(res.status).toBe(200);

			const contentType = res.headers.get("content-type") || "";
			expect(contentType).toContain("application/json");

			const data = (await res.json()) as {
				status: string;
				service: string;
				timestamp: string;
			};
			expect(data.status).toBe("ok");
			expect(data.service).toBe("nextjs-app");
			expect(data.timestamp).toBeDefined();
			expect(new Date(data.timestamp).toString()).not.toBe("Invalid Date");
		});
	});
});
