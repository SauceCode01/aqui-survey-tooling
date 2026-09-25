import type { Container, DIModule } from "@solid-stack/di";
import { IKeyRepo } from "./domain/IKeyRepo.js";
import { ISubmissionSourceRepository } from "./domain/ISubmissionSourceRepository.js";
import { FirebaseKeyRepo } from "./infrastructure/FirebaseKeyRepo.js";
import { FirebaseSubmissionSourceRepository } from "./infrastructure/FirebaseSubmissionSourceRepository.js";

export const SubmissionSourcesProvider: DIModule = (c: Container) => {
	c.provide(ISubmissionSourceRepository, FirebaseSubmissionSourceRepository);
	c.provide(IKeyRepo, FirebaseKeyRepo);
};

export default SubmissionSourcesProvider;
