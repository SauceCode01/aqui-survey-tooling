import type { Container } from "@solid-stack/di";
import { MockSubmissionSourcesApi } from "./api/MockSubmissionSourcesApi";
import { RealSubmissionSourcesApi } from "./api/RealSubmissionSourcesApi";
import { ISubmissionSourcesApi } from "./types/ISubmissionSourcesApi";

export function registerSubmissionSourcesDi(
	container: Container,
	useMocks: boolean,
): void {
	if (useMocks) {
		container.provide(ISubmissionSourcesApi, MockSubmissionSourcesApi);
	} else {
		container.provide(ISubmissionSourcesApi, RealSubmissionSourcesApi);
	}
}
