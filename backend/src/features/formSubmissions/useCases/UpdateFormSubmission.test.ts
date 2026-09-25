import { Container } from "@solid-stack/di";
import { beforeEach, describe, expect, it } from "vitest";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";
import { StubFormSubmissionRepository } from "../infrastructure/StubFormSubmissionRepository.js";
import { UpdateFormSubmission } from "./UpdateFormSubmission.js";

describe("UpdateFormSubmission Use Case", () => {
	let container: Container;
	let useCase: UpdateFormSubmission;

	beforeEach(() => {
		container = new Container();
		container.provide(IFormSubmissionRepository, StubFormSubmissionRepository);
		useCase = container.resolve(UpdateFormSubmission);
	});

	it("should be successfully resolved from DI container", () => {
		expect(useCase).toBeDefined();
	});
});
