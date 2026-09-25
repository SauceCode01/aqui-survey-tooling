import * as http from "node:http";
import { beforeAll, describe, expect, it } from "vitest";
import { loadEnvironment } from "@/configs/index.js";
import { waitForService } from "@/utils/waitForService.js";

const env = loadEnvironment();

function sendRawRequest(
	urlStr: string,
	method: string,
): Promise<{ status: number; body: string }> {
	return new Promise((resolve, reject) => {
		const parsed = new URL(urlStr);
		const req = http.request(
			{
				hostname: parsed.hostname,
				port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
				path: parsed.pathname + parsed.search,
				method,
				timeout: 3000,
			},
			(res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					resolve({
						status: res.statusCode || 0,
						body: data,
					});
				});
			},
		);
		req.on("error", reject);
		req.on("timeout", () => {
			req.destroy();
			reject(new Error("Request timeout"));
		});
		req.end();
	});
}

describe("Security & Unintended Exposure E2E Suite", () => {
	beforeAll(async () => {
		console.log(`\n========================================`);
		console.log(`Running Security & Exposure Audits:`);
		console.log(`  - Target Gateway URL: ${env.gatewayUrl}`);
		console.log(`========================================\n`);

		await Promise.all([
			waitForService(`${env.gatewayUrl}/health`, "Gateway Health", 60000),
			waitForService(
				`${env.gatewayUrl}/api/health`,
				"Backend API (via Gateway)",
				60000,
			),
			waitForService(
				`${env.gatewayUrl}/web/api/health`,
				"Frontend API (via Gateway)",
				60000,
			),
		]);
	});

	describe("Environment & Secrets Exposure Prevention", () => {
		const sensitiveEnvPaths = [
			"/.env",
			"/.env.local",
			"/.env.prod",
			"/.env.dev",
			"/.env.test",
			"/.env.example",
			"/api/.env",
			"/api/.env.prod",
			"/api/.env.dev",
			"/api/.env.test",
			"/web/.env",
			"/web/.env.prod",
			"/web/.env.dev",
			"/web/.env.test",
		];

		sensitiveEnvPaths.forEach((route) => {
			it(`blocks exposure of sensitive environment file: ${route}`, async () => {
				const res = await fetch(`${env.gatewayUrl}${route}`);

				// A secure server must either return 404 Not Found, 403 Forbidden, or redirect to /web.
				// It must NEVER return 200 OK with raw environment file contents.
				if (res.status === 200) {
					const body = await res.text();
					expect(body).not.toContain("NODE_ENV");
					expect(body).not.toContain("DATABASE_URL");
					expect(body).not.toContain("PORT=");
					expect(body).not.toContain("GATEWAY_PORT=");
				} else {
					expect([404, 403, 301, 302]).toContain(res.status);
				}
			});
		});
	});

	describe("Version Control (.git) & System Credentials Exposure", () => {
		const gitAndSystemPaths = [
			"/.git",
			"/.git/HEAD",
			"/.git/config",
			"/.git/index",
			"/api/.git/HEAD",
			"/web/.git/HEAD",
			"/.ssh/id_rsa",
			"/.ssh/id_rsa.pub",
			"/.aws/credentials",
			"/.bashrc",
			"/.bash_history",
			"/id_rsa",
		];

		gitAndSystemPaths.forEach((route) => {
			it(`prevents leaking version control or system credentials at: ${route}`, async () => {
				const res = await fetch(`${env.gatewayUrl}${route}`);

				if (res.status === 200) {
					const body = await res.text();
					expect(body).not.toContain("ref: refs/heads/");
					expect(body).not.toContain("[core]");
					expect(body).not.toContain("PRIVATE KEY");
					expect(body).not.toContain("aws_secret_access_key");
				} else {
					expect([404, 403, 301, 302]).toContain(res.status);
				}
			});
		});
	});

	describe("Project & Container Configuration Exposure", () => {
		const configPaths = [
			"/Dockerfile",
			"/docker-compose.yml",
			"/docker-compose.prod.yml",
			"/docker-compose.dev.yml",
			"/docker-compose.test.yml",
			"/Makefile",
			"/package.json",
			"/tsconfig.json",
			"/api/Dockerfile",
			"/api/package.json",
			"/api/tsconfig.json",
			"/web/Dockerfile",
			"/web/package.json",
			"/web/tsconfig.json",
		];

		configPaths.forEach((route) => {
			it(`does not expose internal source or build configs at: ${route}`, async () => {
				const res = await fetch(`${env.gatewayUrl}${route}`);

				if (res.status === 200) {
					const body = await res.text();
					expect(body).not.toContain("FROM node:");
					expect(body).not.toContain("services:");
					expect(body).not.toContain('"dependencies":');
				} else {
					expect([404, 403, 301, 302]).toContain(res.status);
				}
			});
		});
	});

	describe("Path Traversal & Directory Climbing Attacks", () => {
		const traversalPayloads = [
			"/../etc/passwd",
			"/api/../../etc/passwd",
			"/web/../../etc/passwd",
			"/api/..%2f..%2fetc/passwd",
			"/web/..%2f..%2fetc/passwd",
			"/api/....//....//etc/passwd",
			"/web/%2e%2e/%2e%2e/etc/passwd",
			"/api/windows/win.ini",
			"/web/windows/win.ini",
		];

		traversalPayloads.forEach((payload) => {
			it(`blocks directory traversal attempt: ${payload}`, async () => {
				const res = await fetch(`${env.gatewayUrl}${payload}`);

				// Must not expose system password or config files
				const body = await res.text();
				expect(body).not.toContain("root:x:0:0:");
				expect(body).not.toContain("[fonts]");

				// Must not return 200 OK for system file paths
				if (res.status === 200) {
					// If 200 is returned, it must be the normal frontend page, not passwd
					expect(body).toContain("<!DOCTYPE html>");
				} else {
					expect([400, 403, 404, 301, 302]).toContain(res.status);
				}
			});
		});
	});

	describe("Internal & Administrative Endpoints Exposure", () => {
		const internalRoutes = [
			"/admin",
			"/admin/",
			"/administrator",
			"/actuator",
			"/actuator/health",
			"/actuator/env",
			"/metrics",
			"/debug",
			"/server-status",
			"/phpmyadmin",
			"/private",
			"/secret",
		];

		internalRoutes.forEach((route) => {
			it(`ensures unexposed management endpoint ${route} is not publicly available`, async () => {
				const res = await fetch(`${env.gatewayUrl}${route}`);
				expect([404, 403, 301, 302]).toContain(res.status);
			});
		});
	});

	describe("HTTP Method Tampering & Disallowed Methods", () => {
		it("rejects TRACE requests to prevent Cross-Site Tracing (XST)", async () => {
			const res = await sendRawRequest(`${env.gatewayUrl}/`, "TRACE");

			// TRACE must never be processed as 200 OK echoing headers
			expect([405, 400, 501, 403, 404, 301]).toContain(res.status);
		});

		it("rejects TRACK requests", async () => {
			const res = await sendRawRequest(`${env.gatewayUrl}/`, "TRACK");

			expect([405, 400, 501, 403, 404, 301]).toContain(res.status);
		});
	});

	describe("Information Leakage on Errors & Malformed Payloads", () => {
		it("handles malformed JSON body without leaking server internals or call stacks", async () => {
			const res = await fetch(`${env.gatewayUrl}/api/users`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{ bad_json_payload: ",
			});

			expect([400, 422, 500]).toContain(res.status);

			const body = await res.text();
			// Ensure raw server filesystem paths or secrets are not exposed
			expect(body).not.toContain("/home/");
			expect(body).not.toContain("DATABASE_URL");
			expect(body).not.toContain("password");
		});
	});
});
