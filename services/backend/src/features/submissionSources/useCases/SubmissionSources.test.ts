import type { Container } from "@solid-stack/di";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContainer } from "@/__tests__/utils/createTestContainer.js";
import { IKeyRepo } from "../domain/IKeyRepo.js";
import { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";
import { StubKeyRepo } from "../infrastructure/StubKeyRepo.js";
import { StubSubmissionSourceRepository } from "../infrastructure/StubSubmissionSourceRepository.js";
import { CreateSourceKey } from "./CreateSourceKey.js";
import { CreateSubmissionSource } from "./CreateSubmissionSource.js";
import { DeleteSubmissionSource } from "./DeleteSubmissionSource.js";
import { GetSubmissionSource } from "./GetSubmissionSource.js";
import { ListSourceKeys } from "./ListSourceKeys.js";
import { ListSubmissionSources } from "./ListSubmissionSources.js";
import { RevokeSourceKey } from "./RevokeSourceKey.js";
import { ValidateSourceKey } from "./ValidateSourceKey.js";

describe("SubmissionSources Use Cases Suite", () => {
	let container: Container;

	beforeEach(async () => {
		container = await createTestContainer();
		container.provide(
			ISubmissionSourceRepository,
			StubSubmissionSourceRepository,
		);
		container.provide(IKeyRepo, StubKeyRepo);
	});

	it("creates, lists, gets, and deletes submission sources", async () => {
		const createUseCase = container.resolve(CreateSubmissionSource);
		const listUseCase = container.resolve(ListSubmissionSources);
		const getUseCase = container.resolve(GetSubmissionSource);
		const deleteUseCase = container.resolve(DeleteSubmissionSource);

		// 1. Create source
		const created = await createUseCase.execute({
			submissionSource: { name: "Customer Feedback Form" },
		});
		expect(created.submissionSource.id).toBeDefined();
		expect(created.submissionSource.name).toBe("Customer Feedback Form");

		// 2. List sources
		const listResult = await listUseCase.execute();
		expect(listResult.submissionSources.length).toBe(1);
		expect(listResult.submissionSources[0]?.name).toBe(
			"Customer Feedback Form",
		);

		// 3. Get source by ID
		const getResult = await getUseCase.execute({
			submissionSourceId: created.submissionSource.id,
		});
		expect(getResult.submissionSource.id).toBe(created.submissionSource.id);

		// 4. Delete source
		const deleteResult = await deleteUseCase.execute({
			submissionSourceId: created.submissionSource.id,
		});
		expect(deleteResult.success).toBe(true);

		const listAfterDelete = await listUseCase.execute();
		expect(listAfterDelete.submissionSources.length).toBe(0);
	});

	it("creates, validates, lists, and revokes source keys", async () => {
		const createSourceUseCase = container.resolve(CreateSubmissionSource);
		const createKeyUseCase = container.resolve(CreateSourceKey);
		const validateKeyUseCase = container.resolve(ValidateSourceKey);
		const listKeysUseCase = container.resolve(ListSourceKeys);
		const revokeKeyUseCase = container.resolve(RevokeSourceKey);

		// Create source first
		const source = await createSourceUseCase.execute({
			submissionSource: { name: "Google Forms Webhook" },
		});

		// Create key
		const keyResult = await createKeyUseCase.execute({
			submissionSourceId: source.submissionSource.id,
		});
		expect(keyResult.key).toBeDefined();

		// Validate key
		const validateResult = await validateKeyUseCase.execute({
			key: keyResult.key,
		});
		expect(validateResult.success).toBe(true);
		expect(validateResult.payload.sourceId).toBe(source.submissionSource.id);

		// List keys
		const keysList = await listKeysUseCase.execute({
			submissionSourceId: source.submissionSource.id,
		});
		expect(keysList.keys.length).toBe(1);
		expect(keysList.keys[0]?.isValid).toBe(true);

		const firstKey = keysList.keys[0];
		expect(firstKey).toBeDefined();
		if (!firstKey) throw new Error("Key not found");

		// Revoke key
		const revokeResult = await revokeKeyUseCase.execute({
			keyId: firstKey.id,
		});
		expect(revokeResult.success).toBe(true);

		// Validating revoked key should fail
		await expect(
			validateKeyUseCase.execute({ key: keyResult.key }),
		).rejects.toThrow();

		// Listing keys shows it is now invalid
		const keysListAfter = await listKeysUseCase.execute({
			submissionSourceId: source.submissionSource.id,
		});
		expect(keysListAfter.keys[0]?.isValid).toBe(false);
	});
});
