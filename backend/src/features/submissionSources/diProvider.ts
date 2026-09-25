import type { Container, DIModule } from "@solid-stack/di";
import { IKeyRepo } from "./domain/IKeyRepo.js";
import { ISubmissionSourceRepository } from "./domain/ISubmissionSourceRepository.js";
import { FirebaseKeyRepo } from "./infrastructure/FirebaseKeyRepo.js";
import { FirebaseSubmissionSourceRepository } from "./infrastructure/FirebaseSubmissionSourceRepository.js";
import { StubKeyRepo } from "./infrastructure/StubKeyRepo.js";
import { StubSubmissionSourceRepository } from "./infrastructure/StubSubmissionSourceRepository.js";

export const SubmissionSourcesProvider: DIModule = (c: Container) => {
	const isIsolated = process.env.INFRA_MODE === "isolated";

	if (isIsolated) {
		c.provide(ISubmissionSourceRepository, StubSubmissionSourceRepository);
		c.provide(IKeyRepo, StubKeyRepo);
	} else {
		c.provide(ISubmissionSourceRepository, FirebaseSubmissionSourceRepository);
		c.provide(IKeyRepo, FirebaseKeyRepo);
	}
};

export default SubmissionSourcesProvider;
