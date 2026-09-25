import { beforeAll, describe, expect, it } from "vitest";
import { loadEnvironment } from "@/configs/index.js";
import { waitForService } from "@/utils/waitForService.js";

const env = loadEnvironment();

describe("Backend API E2E Suite (via Gateway Instance)", () => {
	beforeAll(async () => {
		console.log(`\n========================================`);
		console.log(`Testing Backend API via Gateway Instance:`);
		console.log(`  - Gateway URL: ${env.gatewayUrl}`);
		console.log(`  - Gateway API: ${env.gatewayUrl}/api`);
		console.log(`========================================\n`);

		await waitForService(
			`${env.gatewayUrl}/api/health`,
			"Backend API (via Gateway)",
			30000,
		);
	});

	describe("Backend Health Check", () => {
		it("GET /api/health through Gateway returns healthy status", async () => {
			const res = await fetch(`${env.gatewayUrl}/api/health`);
			expect(res.status).toBe(200);

			const contentType = res.headers.get("content-type") || "";
			expect(contentType).toContain("application/json");

			const body = (await res.json()) as { status: string };
			expect(body).toEqual({ status: "success" });
		});
	});

	describe("Complete Workflow: Source -> API Key -> Form Submissions", () => {
		const testSources = [
			{ name: "Google Forms - Feedback Survey", platform: "Google Forms" },
			{ name: "Typeform - Customer Onboarding", platform: "Typeform" },
			{ name: "JotForm - Event Registration", platform: "JotForm" },
		];

		for (const sourceDef of testSources) {
			it(`executes full lifecycle for '${sourceDef.name}' with multiple submissions`, async () => {
				const timestamp = Date.now();
				const sourceName = `${sourceDef.name} (${timestamp})`;

				// 1. Create Submission Source
				const createSourceRes = await fetch(
					`${env.gatewayUrl}/api/submissionSources/`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							data: { name: sourceName },
						}),
					},
				);
				expect(createSourceRes.status).toBe(201);
				const createSourceBody = (await createSourceRes.json()) as {
					status: string;
					data: { id: string };
				};
				expect(createSourceBody.status).toBe("success");
				expect(createSourceBody.data?.id).toBeDefined();

				const sourceId = createSourceBody.data.id;

				// Verify source was persisted
				const getSourceRes = await fetch(
					`${env.gatewayUrl}/api/submissionSources/${sourceId}`,
				);
				expect(getSourceRes.status).toBe(200);
				const getSourceBody = (await getSourceRes.json()) as {
					status: string;
					data: {
						submissionSource?: { id: string; name: string };
						id?: string;
						name?: string;
					};
				};
				const sourceEntity =
					getSourceBody.data.submissionSource || getSourceBody.data;
				expect(sourceEntity?.id).toBe(sourceId);
				expect(sourceEntity?.name).toBe(sourceName);

				// 2. Create API Key for the Source
				const createKeyRes = await fetch(
					`${env.gatewayUrl}/api/submissionSources/createkey`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							data: { id: sourceId },
						}),
					},
				);
				expect(createKeyRes.status).toBe(201);
				const createKeyBody = (await createKeyRes.json()) as {
					status: string;
					data: { key: string };
				};
				expect(createKeyBody.status).toBe("success");
				expect(createKeyBody.data?.key).toBeDefined();
				expect(typeof createKeyBody.data.key).toBe("string");

				const sourceKey = createKeyBody.data.key;

				// List keys for source and find key ID
				const listKeysRes = await fetch(
					`${env.gatewayUrl}/api/submissionSources/keys?submissionSourceId=${sourceId}`,
				);
				expect(listKeysRes.status).toBe(200);
				const listKeysBody = (await listKeysRes.json()) as {
					status: string;
					data: {
						keys?: Array<{ id: string; key: string; isValid: boolean }>;
					};
				};
				const keysList = listKeysBody.data.keys || [];
				const activeKey = keysList.find((k) => k.key === sourceKey);
				expect(activeKey).toBeDefined();
				expect(activeKey?.isValid).toBe(true);

				// 3. Create Multiple Submissions using the Source and Key
				const submissionPayloads = [
					{
						email: `respondent_1_${timestamp}@example.com`,
						answers: [
							{
								question: "How satisfied are you with our service?",
								questionType: "rating",
								answerType: "string" as const,
								answer: "5/5 - Excellent",
							},
							{
								question: "What features would you like to see?",
								questionType: "multipleChoice",
								answerType: "string[]" as const,
								answer: ["Real-time alerts", "Export to CSV"],
							},
						],
					},
					{
						email: `respondent_2_${timestamp}@example.com`,
						answers: [
							{
								question: "Would you recommend us to a colleague?",
								questionType: "boolean",
								answerType: "string" as const,
								answer: "Yes, definitely",
							},
							{
								question: "Primary use case",
								questionType: "singleChoice",
								answerType: "string" as const,
								answer: "Customer Satisfaction Survey",
							},
						],
					},
				];

				const createdSubmissionIds: string[] = [];

				for (const payload of submissionPayloads) {
					const submitRes = await fetch(
						`${env.gatewayUrl}/api/formSubmissions/`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								data: {
									email: payload.email,
									sourceKey: sourceKey,
									answers: payload.answers,
								},
							}),
						},
					);

					expect(submitRes.status).toBe(201);
					const submitBody = (await submitRes.json()) as {
						status: string;
						data: { id: string; email: string };
					};
					expect(submitBody.status).toBe("success");
					expect(submitBody.data?.id).toBeDefined();
					expect(submitBody.data.email).toBe(payload.email);

					createdSubmissionIds.push(submitBody.data.id);

					// Verify submission retrieval
					const getSubRes = await fetch(
						`${env.gatewayUrl}/api/formSubmissions/${submitBody.data.id}`,
					);
					expect(getSubRes.status).toBe(200);
					const getSubBody = (await getSubRes.json()) as {
						status: string;
						data: {
							formSubmission?: {
								id: string;
								email: string;
								sourceId: string;
								answers: unknown[];
							};
							id?: string;
							email?: string;
							sourceId?: string;
						};
					};
					const subEntity = getSubBody.data.formSubmission || getSubBody.data;
					expect(subEntity?.id).toBe(submitBody.data.id);
					expect(subEntity?.email).toBe(payload.email);
					expect(subEntity?.sourceId).toBe(sourceId);
				}

				// 4. Verify Submissions Filtered by Source
				const listSubmissionsRes = await fetch(
					`${env.gatewayUrl}/api/formSubmissions/?sourceId=${sourceId}`,
				);
				expect(listSubmissionsRes.status).toBe(200);
				const listSubmissionsBody = (await listSubmissionsRes.json()) as {
					status: string;
					data: {
						formSubmissions?: Array<{
							id: string;
							email: string;
							sourceId: string;
						}>;
					};
				};
				const retrievedSubmissions =
					listSubmissionsBody.data.formSubmissions || [];
				expect(retrievedSubmissions.length).toBeGreaterThanOrEqual(2);

				for (const subId of createdSubmissionIds) {
					const match = retrievedSubmissions.find((s) => s.id === subId);
					expect(match).toBeDefined();
					expect(match?.sourceId).toBe(sourceId);
				}

				// 5. Revoke Key and Verify Subsequent Submission Fails
				if (activeKey?.id) {
					const revokeRes = await fetch(
						`${env.gatewayUrl}/api/submissionSources/revoke-key`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								data: { keyId: activeKey.id },
							}),
						},
					);
					expect(revokeRes.status).toBe(200);

					// Attempt to submit with revoked key -> Must be rejected
					const rejectedSubmitRes = await fetch(
						`${env.gatewayUrl}/api/formSubmissions/`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								data: {
									email: `unauthorized_${timestamp}@example.com`,
									sourceKey: sourceKey,
									answers: [
										{
											question: "Should fail",
											questionType: "text",
											answerType: "string",
											answer: "Fail",
										},
									],
								},
							}),
						},
					);
					expect(rejectedSubmitRes.status).toBeGreaterThanOrEqual(400);
				}
			});
		}
	});
});
