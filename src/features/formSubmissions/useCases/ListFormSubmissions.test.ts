import { Container } from "@solid-stack/di";
import { beforeEach, describe, expect, it } from "vitest";
import { IFormSubmissionRepository } from "../domain/IFormSubmissionRepository.js";
import { StubFormSubmissionRepository } from "../infrastructure/StubFormSubmissionRepository.js";
import { ListFormSubmissions } from "./ListFormSubmissions.js";

describe("ListFormSubmissions Use Case", () => {
	let container: Container;
	let useCase: ListFormSubmissions;

	beforeEach(() => {
		container = new Container();
		container.provide(IFormSubmissionRepository, StubFormSubmissionRepository);
		useCase = container.resolve(ListFormSubmissions);
	});

	it("should be successfully resolved from DI container", () => {
		expect(useCase).toBeDefined();
	});
});
