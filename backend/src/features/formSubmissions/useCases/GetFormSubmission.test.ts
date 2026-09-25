import { Container } from "@solid-stack/di";
import { beforeEach, describe, expect, it } from "vitest";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";
import { StubFormSubmissionRepository } from "../infrastructure/StubFormSubmissionRepository.js";
import { GetFormSubmission } from "./GetFormSubmission.js";

describe("GetFormSubmission Use Case", () => {
	let container: Container;
	let useCase: GetFormSubmission;

	beforeEach(() => {
		container = new Container();
		container.provide(IFormSubmissionRepository, StubFormSubmissionRepository);
		useCase = container.resolve(GetFormSubmission);
	});

	it("should be successfully resolved from DI container", () => {
		expect(useCase).toBeDefined();
	});
});
