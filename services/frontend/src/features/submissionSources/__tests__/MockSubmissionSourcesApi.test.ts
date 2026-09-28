import { beforeEach, describe, expect, it } from "vitest";
import { MockSubmissionSourcesApi } from "../api/MockSubmissionSourcesApi";

describe("MockSubmissionSourcesApi", () => {
	let api: MockSubmissionSourcesApi;

	beforeEach(() => {
		api = new MockSubmissionSourcesApi();
	});

	it("lists default submission sources", async () => {
		const sources = await api.listSources();
		expect(sources.length).toBeGreaterThan(0);
		expect(sources[0]?.name).toBeDefined();
	});

	it("creates and retrieves a submission source", async () => {
		const created = await api.createSource({ name: "Event Survey" });
		expect(created.id).toBeDefined();
		expect(created.name).toBe("Event Survey");

		const fetched = await api.getSource(created.id);
		expect(fetched.name).toBe("Event Survey");
	});

	it("deletes a submission source and its associated keys", async () => {
		const created = await api.createSource({ name: "To Delete" });
		await api.createKey(created.id);

		const deleteSuccess = await api.deleteSource(created.id);
		expect(deleteSuccess).toBe(true);

		await expect(api.getSource(created.id)).rejects.toThrow();

		const keys = await api.listKeys(created.id);
		expect(keys.length).toBe(0);
	});

	it("generates, lists, and revokes API keys for a source", async () => {
		const sources = await api.listSources();
		const source = sources[0];
		if (!source) throw new Error("Source not found");

		const initialKeys = await api.listKeys(source.id);
		const initialCount = initialKeys.length;

		// Generate new key
		const newKey = await api.createKey(source.id);
		expect(newKey.key).toBeDefined();

		const updatedKeys = await api.listKeys(source.id);
		expect(updatedKeys.length).toBe(initialCount + 1);

		const generatedKeyObj = updatedKeys[0];
		if (!generatedKeyObj) throw new Error("Generated key object not found");
		expect(generatedKeyObj.isValid).toBe(true);

		// Revoke the key
		const revokeSuccess = await api.revokeKey(generatedKeyObj.id);
		expect(revokeSuccess).toBe(true);

		const keysAfterRevoke = await api.listKeys(source.id);
		const revokedKey = keysAfterRevoke.find((k) => k.id === generatedKeyObj.id);
		expect(revokedKey?.isValid).toBe(false);
	});
});
