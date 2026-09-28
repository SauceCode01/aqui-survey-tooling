import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Next.js Route Handler: /api/health", () => {
	it("returns HTTP 200 with status ok and service nextjs-app", async () => {
		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.status).toBe("ok");
		expect(data.service).toBe("nextjs-app");
		expect(data.timestamp).toBeDefined();
	});
});
