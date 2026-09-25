import { describe, expect, it } from "vitest";
import {
	APP_NAME,
	DEFAULT_META_DESCRIPTION,
	generatePageMetadata,
} from "@/shared/lib/metadata";

describe("generatePageMetadata", () => {
	it("formats title with app name suffix", () => {
		const meta = generatePageMetadata({ title: "Task Detail" });
		expect(meta.title).toBe(`Task Detail | ${APP_NAME}`);
		expect(meta.description).toBe(DEFAULT_META_DESCRIPTION);
	});

	it("uses default app name when title is omitted", () => {
		const meta = generatePageMetadata();
		expect(meta.title).toBe(APP_NAME);
	});

	it("includes OpenGraph metadata", () => {
		const meta = generatePageMetadata({
			title: "Projects",
			description: "Manage projects",
			path: "/projects",
		});
		expect(meta.openGraph?.title).toBe(`Projects | ${APP_NAME}`);
		expect(meta.openGraph?.description).toBe("Manage projects");
		expect(meta.openGraph?.siteName).toBe(APP_NAME);
	});
});
