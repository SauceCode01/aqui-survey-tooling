import { Container } from "@solid-stack/di";
import { beforeEach, describe, expect, it } from "vitest";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";
import { StubFormSubmissionRepository } from "../infrastructure/StubFormSubmissionRepository.js";
import { DeleteFormSubmission } from "./DeleteFormSubmission.js";

describe("DeleteFormSubmission Use Case", () => {
	let container: Container;
	let useCase: DeleteFormSubmission;

	beforeEach(() => {
		container = new Container();
		container.provide(IFormSubmissionRepository, StubFormSubmissionRepository);
		useCase = container.resolve(DeleteFormSubmission);
	});

	it("should be successfully resolved from DI container", () => {
		expect(useCase).toBeDefined();
	});
});
