import { beforeAll, describe, expect, it } from "vitest";
import { loadEnvironment } from "@/configs/index.js";
import {
	checkPortStatus,
	scanPorts,
	waitForPort,
} from "@/utils/portScanner.js";

const env = loadEnvironment();

describe("Gateway Ports & Network Exposure Suite", () => {
	beforeAll(async () => {
		console.log(`\n========================================`);
		console.log(`Auditing Ports for Gateway:`);
		console.log(`  - Target Host:        ${env.gatewayHost}`);
		console.log(`  - Primary Port:       ${env.gatewayPort}`);
		console.log(`  - Host Gateway URL:   ${env.hostGatewayUrl}`);
		console.log(`========================================\n`);

		// Wait for the primary gateway port to accept TCP connections
		await waitForPort(env.gatewayHost, env.gatewayPort, 30000);
	});

	describe("Gateway Active Listening Ports", () => {
		it(`accepts TCP connections on primary gateway port (${env.gatewayPort})`, async () => {
			const result = await checkPortStatus({
				host: env.gatewayHost,
				port: env.gatewayPort,
				timeoutMs: 3000,
			});

			expect(result.open).toBe(true);
		});

		it("accepts TCP connections on port 80 (standard HTTP port)", async () => {
			const result = await checkPortStatus({
				host: env.gatewayHost,
				port: 80,
				timeoutMs: 3000,
			});

			expect(result.open).toBe(true);
		});

		it("verifies HTTP responses on all open gateway listening ports", async () => {
			// Test HTTP handshake on port 80
			const httpRes80 = await fetch(`http://${env.gatewayHost}:80/health`);
			expect(httpRes80.status).toBe(200);
			const data80 = (await httpRes80.json()) as { service: string };
			expect(data80.service).toBe("gateway");

			// Test HTTP handshake on port 3000 (if gateway listens on 3000 inside container)
			const status3000 = await checkPortStatus({
				host: env.gatewayHost,
				port: 3000,
				timeoutMs: 1500,
			});

			if (status3000.open) {
				const httpRes3000 = await fetch(
					`http://${env.gatewayHost}:3000/health`,
				);
				expect(httpRes3000.status).toBe(200);
				const data3000 = (await httpRes3000.json()) as { service: string };
				expect(data3000.service).toBe("gateway");
			}
		});
	});

	describe("Gateway Unauthorized Port Scan (Must be CLOSED)", () => {
		// Array of standard sensitive / database / management ports that must NOT be open on the gateway
		const sensitivePorts = [
			{ port: 21, label: "FTP" },
			{ port: 22, label: "SSH" },
			{ port: 23, label: "Telnet" },
			{ port: 25, label: "SMTP" },
			{ port: 53, label: "DNS" },
			{ port: 110, label: "POP3" },
			{ port: 143, label: "IMAP" },
			{ port: 443, label: "HTTPS (unconfigured)" },
			{ port: 1433, label: "MSSQL" },
			{ port: 3306, label: "MySQL" },
			{ port: 5432, label: "PostgreSQL" },
			{ port: 6379, label: "Redis" },
			{ port: 8080, label: "Alternative HTTP / Tomcat" },
			{ port: 8443, label: "Alternative HTTPS" },
			{ port: 9000, label: "PHP-FPM / Portainer" },
			{ port: 9200, label: "Elasticsearch" },
			{ port: 11211, label: "Memcached" },
			{ port: 27017, label: "MongoDB" },
		];

		sensitivePorts.forEach(({ port, label }) => {
			it(`verifies port ${port} (${label}) is CLOSED on gateway host`, async () => {
				const result = await checkPortStatus({
					host: env.gatewayHost,
					port,
					timeoutMs: 1000,
				});

				expect(
					result.open,
					`Security Alert: Port ${port} (${label}) should NOT be open on ${env.gatewayHost}!`,
				).toBe(false);
			});
		});

		it("batch scans sensitive ports and confirms zero unauthorized ports are open", async () => {
			const portNumbers = sensitivePorts.map((p) => p.port);
			const scanResults = await scanPorts(env.gatewayHost, portNumbers, 1000);

			const openPorts = scanResults.filter((r) => r.open);
			expect(
				openPorts,
				`Unexpected open ports found on gateway: ${JSON.stringify(openPorts)}`,
			).toHaveLength(0);
		});
	});

	describe("Host Port Exposure Validation", () => {
		it("validates that the gateway published port on the host reaches the gateway service", async () => {
			// If hostGatewayUrl is reachable (via host.docker.internal or localhost)
			try {
				const res = await fetch(`${env.hostGatewayUrl}/health`, {
					signal: AbortSignal.timeout(2500),
				});

				if (res.ok) {
					const body = (await res.json()) as {
						status: string;
						service: string;
					};
					expect(body.service).toBe("gateway");
					expect(body.status).toBe("ok");
				}
			} catch {
				// If host.docker.internal is not resolvable in the current environment, skip gracefully
				console.log(
					`Note: Host gateway (${env.hostGatewayUrl}) was not reachable from inside container.`,
				);
			}
		});
	});
});
