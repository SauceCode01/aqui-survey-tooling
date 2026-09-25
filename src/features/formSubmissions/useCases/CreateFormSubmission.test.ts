import type { Container } from "@solid-stack/di";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContainer } from "@/__tests__/utils/createTestContainer.js";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";
import { StubFormSubmissionRepository } from "../infrastructure/StubFormSubmissionRepository.js";
import { CreateFormSubmission } from "./CreateFormSubmission.js";

describe("CreateFormSubmission Use Case", () => {
	let container: Container;
	let useCase: CreateFormSubmission;

	beforeEach(async () => {
		container = await createTestContainer();
		container.provide(IFormSubmissionRepository, StubFormSubmissionRepository);
		useCase = container.resolve(CreateFormSubmission);
	});

	it("should be successfully resolved from DI container", () => {
		expect(useCase).toBeDefined();
	});
});
