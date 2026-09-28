import { Container } from "@solid-stack/di";
import { describe, expect, it } from "vitest";
import { MockFormSubmissionsApi } from "@/features/formSubmissions/api/MockFormSubmissionsApi";
import { RealFormSubmissionsApi } from "@/features/formSubmissions/api/RealFormSubmissionsApi";
import { registerFormSubmissionsDi } from "@/features/formSubmissions/di";
import { IFormSubmissionsApi } from "@/features/formSubmissions/types/IFormSubmissionsApi";
import { MockSubmissionSourcesApi } from "@/features/submissionSources/api/MockSubmissionSourcesApi";
import { RealSubmissionSourcesApi } from "@/features/submissionSources/api/RealSubmissionSourcesApi";
import { registerSubmissionSourcesDi } from "@/features/submissionSources/di";
import { ISubmissionSourcesApi } from "@/features/submissionSources/types/ISubmissionSourcesApi";
import { container, loadDi } from "../container";

describe("DI Container and Dependency Swapping", () => {
	it("resolves default exported container with valid ISubmissionSourcesApi and IFormSubmissionsApi instance", () => {
		expect(container).toBeDefined();

		const sourcesApi = container.resolve(ISubmissionSourcesApi);
		expect(sourcesApi).toBeDefined();

		const submissionsApi = container.resolve(IFormSubmissionsApi);
		expect(submissionsApi).toBeDefined();
	});

	it("binds RealSubmissionSourcesApi and RealFormSubmissionsApi implementation when useMocks is false", () => {
		const customContainer = new Container();
		registerSubmissionSourcesDi(customContainer, false);
		registerFormSubmissionsDi(customContainer, false);

		const sources = customContainer.resolve(ISubmissionSourcesApi);
		expect(sources).toBeInstanceOf(RealSubmissionSourcesApi);

		const subs = customContainer.resolve(IFormSubmissionsApi);
		expect(subs).toBeInstanceOf(RealFormSubmissionsApi);
	});

	it("binds MockSubmissionSourcesApi and MockFormSubmissionsApi implementation when useMocks is true", () => {
		const customContainer = new Container();
		registerSubmissionSourcesDi(customContainer, true);
		registerFormSubmissionsDi(customContainer, true);

		const sources = customContainer.resolve(ISubmissionSourcesApi);
		expect(sources).toBeInstanceOf(MockSubmissionSourcesApi);

		const subs = customContainer.resolve(IFormSubmissionsApi);
		expect(subs).toBeInstanceOf(MockFormSubmissionsApi);
	});

	it("loadDi binds contracts to an existing or new container", () => {
		const newContainer = loadDi(new Container());
		expect(newContainer.resolve(ISubmissionSourcesApi)).toBeDefined();
		expect(newContainer.resolve(IFormSubmissionsApi)).toBeDefined();
	});
});
