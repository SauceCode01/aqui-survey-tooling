import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
	process.env.BASE_URL || process.env.API_URL || "http://localhost:3000";

export default defineConfig({
	timeout: 60000,
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: BASE_URL,
		ignoreHTTPSErrors: true,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				launchOptions: {
					executablePath:
						process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage",
					],
				},
			},
		},
	],
});
