import { Container } from "@solid-stack/di";
import { registerFormSubmissionsDi } from "@/features/formSubmissions/di";
import { registerSubmissionSourcesDi } from "@/features/submissionSources/di";
import { isMockMode } from "@/shared/env/env";

export type FeatureRegistrar = (
	container: Container,
	useMocks: boolean,
) => void;

export const FEATURE_REGISTRARS: FeatureRegistrar[] = [
	registerSubmissionSourcesDi,
	registerFormSubmissionsDi,
];

/**
 * Loads and binds feature API implementations to their abstract contracts in @solid-stack/di.
 * Swaps between Real and Mock implementations based on isMockMode().
 */
export function loadDi(targetContainer?: Container): Container {
	const c = targetContainer ?? new Container();
	const useMocks = isMockMode();

	for (const register of FEATURE_REGISTRARS) {
		register(c, useMocks);
	}

	return c;
}

export const container = loadDi();
