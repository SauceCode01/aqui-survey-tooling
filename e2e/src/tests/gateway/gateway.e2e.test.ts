import { beforeAll, describe, expect, it } from "vitest";
import { loadEnvironment } from "@/configs/index.js";
import { waitForService } from "@/utils/waitForService.js";

const env = loadEnvironment();

describe("Gateway Integration & Routing E2E Suite", () => {
	beforeAll(async () => {
		console.log(`\n========================================`);
		console.log(`Connecting to Running Gateway Instance:`);
		console.log(`  - Gateway URL:  ${env.gatewayUrl}`);
		console.log(`  - Gateway Host: ${env.gatewayHost}`);
		console.log(`  - Gateway Port: ${env.gatewayPort}`);
		console.log(`========================================\n`);

		// Verify the Gateway is up and responsive before executing tests
		await Promise.all([
			waitForService(`${env.gatewayUrl}/health`, "Gateway /health", 30000),
			waitForService(
				`${env.gatewayUrl}/api/health`,
				"Gateway -> Backend (/api/health)",
				30000,
			),
			waitForService(
				`${env.gatewayUrl}/web/api/health`,
				"Gateway -> Frontend (/web/api/health)",
				30000,
			),
		]);
	});

	describe("Gateway Core Health & Identity", () => {
		it("GET /health returns 200 OK with gateway identity metadata", async () => {
			const res = await fetch(`${env.gatewayUrl}/health`);
			expect(res.status).toBe(200);

			const contentType = res.headers.get("content-type") || "";
			expect(contentType).toContain("application/json");

			const data = (await res.json()) as { status: string; service: string };
			expect(data).toEqual({
				status: "ok",
				service: "gateway",
			});
		});

		it("GET /health responds with valid HTTP headers", async () => {
			const res = await fetch(`${env.gatewayUrl}/health`);
			expect(res.headers.has("date")).toBe(true);
			expect(res.headers.has("content-type")).toBe(true);
		});
	});

	describe("Gateway Root & Path Redirection", () => {
		it("GET / redirects root traffic to /web with 301 Moved Permanently", async () => {
			const res = await fetch(`${env.gatewayUrl}/`, {
				redirect: "manual",
			});

			expect(res.status).toBe(301);
			const location = res.headers.get("location");
			expect(location).toBe("/web");
		});

		it("GET /api (without trailing slash) redirects to /api/ with 301 Moved Permanently", async () => {
			const res = await fetch(`${env.gatewayUrl}/api`, {
				redirect: "manual",
			});

			expect(res.status).toBe(301);
			const location = res.headers.get("location");
			expect(location).toBe("/api/");
		});
	});

	describe("Gateway Reverse Proxy Routing & Service Multiplexing", () => {
		it("proxies /api/health to the Backend Express service", async () => {
			const res = await fetch(`${env.gatewayUrl}/api/health`);
			expect(res.status).toBe(200);

			const contentType = res.headers.get("content-type") || "";
			expect(contentType).toContain("application/json");

			const data = (await res.json()) as { status: string };
			expect(data.status).toBe("success");
		});

		it("proxies /web/api/health to the Frontend Next.js API route", async () => {
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
			expect(typeof data.timestamp).toBe("string");
		});

		it("proxies /web to Next.js dashboard HTML page", async () => {
			const res = await fetch(`${env.gatewayUrl}/web`);
			expect(res.status).toBe(200);

			const contentType = res.headers.get("content-type") || "";
			expect(contentType).toContain("text/html");

			const text = await res.text();
			expect(text).toContain("<!DOCTYPE html>");
			expect(text).toContain("SolidStack");
		});
	});

	describe("Gateway Route Isolation & Boundary Protection", () => {
		it("returns 404 for unmapped top-level routes", async () => {
			const res = await fetch(
				`${env.gatewayUrl}/unknown-gateway-route-${Date.now()}`,
			);
			expect(res.status).toBe(404);
		});

		it("returns 404 for nonexistent subpaths under /api/", async () => {
			const res = await fetch(
				`${env.gatewayUrl}/api/non-existent-endpoint-${Date.now()}`,
			);
			expect(res.status).toBe(404);
		});

		it("returns 404 for nonexistent subpaths under /web/", async () => {
			const res = await fetch(
				`${env.gatewayUrl}/web/non-existent-page-${Date.now()}`,
			);
			expect(res.status).toBe(404);
		});

		it("strictly isolates /api routes from frontend logic", async () => {
			// Accessing backend route should never return frontend Next.js HTML
			const res = await fetch(`${env.gatewayUrl}/api/health`);
			const text = await res.text();
			expect(text).not.toContain("<!DOCTYPE html>");
			expect(text).not.toContain("SolidStack");
		});

		it("strictly isolates /web routes from backend API handlers", async () => {
			// Accessing frontend route should return Next.js HTML, not Express API JSON
			const res = await fetch(`${env.gatewayUrl}/web`);
			const contentType = res.headers.get("content-type") || "";
			expect(contentType).toContain("text/html");
		});
	});

	describe("Gateway Header Forwarding & Proxy Integrity", () => {
		it("preserves response headers from upstream services", async () => {
			const res = await fetch(`${env.gatewayUrl}/api/health`);
			expect(res.status).toBe(200);
			expect(res.headers.has("content-type")).toBe(true);
			expect(res.headers.has("date")).toBe(true);
		});

		it("handles concurrent requests across multiplexed routes reliably", async () => {
			const requests = [
				fetch(`${env.gatewayUrl}/health`),
				fetch(`${env.gatewayUrl}/api/health`),
				fetch(`${env.gatewayUrl}/web/api/health`),
			];

			const responses = await Promise.all(requests);
			responses.forEach((res) => {
				expect(res.status).toBe(200);
			});
		});
	});
});
