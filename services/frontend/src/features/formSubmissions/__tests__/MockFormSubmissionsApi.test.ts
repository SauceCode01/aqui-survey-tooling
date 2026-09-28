import { beforeEach, describe, expect, it } from "vitest";
import { MockFormSubmissionsApi } from "../api/MockFormSubmissionsApi";

describe("MockFormSubmissionsApi", () => {
	let api: MockFormSubmissionsApi;

	beforeEach(() => {
		api = new MockFormSubmissionsApi();
	});

	it("lists all submissions and filters by sourceId", async () => {
		const all = await api.listSubmissions();
		expect(all.length).toBeGreaterThan(0);

		const googleSubmissions = await api.listSubmissions("src-google-forms");
		expect(googleSubmissions.length).toBeGreaterThan(0);
		for (const sub of googleSubmissions) {
			expect(sub.sourceId).toBe("src-google-forms");
		}
	});

	it("gets submission details by ID", async () => {
		const all = await api.listSubmissions();
		const first = all[0];
		if (!first) throw new Error("No submissions found");

		const fetched = await api.getSubmission(first.id);
		expect(fetched.id).toBe(first.id);
		expect(fetched.email).toBe(first.email);
		expect(fetched.answers.length).toBeGreaterThan(0);
	});

	it("creates a submission and can retrieve it", async () => {
		const result = await api.createSubmission({
			email: "new.respondent@example.com",
			answers: [
				{
					question: "Overall Rating",
					questionType: "rating",
					answerType: "string",
					answer: "5 stars",
				},
			],
			sourceKey: "dummy-key",
		});

		expect(result.id).toBeDefined();
		expect(result.email).toBe("new.respondent@example.com");

		const fetched = await api.getSubmission(result.id);
		expect(fetched.email).toBe("new.respondent@example.com");
		expect(fetched.answers[0]?.answer).toBe("5 stars");
	});

	it("deletes a submission", async () => {
		const created = await api.createSubmission({
			email: "to.delete@example.com",
			answers: [],
			sourceKey: "dummy",
		});

		const deleted = await api.deleteSubmission(created.id);
		expect(deleted).toBe(true);

		await expect(api.getSubmission(created.id)).rejects.toThrow();
	});
});
