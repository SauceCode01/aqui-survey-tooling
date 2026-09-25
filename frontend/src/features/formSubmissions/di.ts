import type { Container } from "@solid-stack/di";
import { MockFormSubmissionsApi } from "./api/MockFormSubmissionsApi";
import { RealFormSubmissionsApi } from "./api/RealFormSubmissionsApi";
import { IFormSubmissionsApi } from "./types/IFormSubmissionsApi";

export function registerFormSubmissionsDi(
	container: Container,
	useMocks: boolean,
): void {
	if (useMocks) {
		container.provide(IFormSubmissionsApi, MockFormSubmissionsApi);
	} else {
		container.provide(IFormSubmissionsApi, RealFormSubmissionsApi);
	}
}
