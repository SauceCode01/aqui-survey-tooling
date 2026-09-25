import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { AppError } from "@/errors/AppError.js";
import { NotFoundError } from "@/errors/NotFoundError.js";
import { Jwt } from "@/shared/jwt/Jwt.js";
import { Clock } from "@/shared/time/Clock.js";
import { Uuid } from "@/shared/uuid/Uuid.js";
import { IKeyRepo, type KeyPayload } from "../domain/IKeyRepo.js";
import { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";

export type CreateSourceKeyInput = {
	submissionSourceId: string;
};

export type CreateSourceKeyOutput = {
	key: string;
};

@MakeInjectable
export class CreateSourceKey {
	public static deps = {
		repo: ISubmissionSourceRepository,
		jwt: Jwt,
		clock: Clock,
		uuid: Uuid,
		keyRepo: IKeyRepo,
	};

	constructor(public deps: DepsType<typeof CreateSourceKey.deps>) {}

	async execute(_props: CreateSourceKeyInput): Promise<CreateSourceKeyOutput> {
		// check if source exists
		const source = await this.deps.repo.GetSubmissionSourceById({
			submissionSourceId: _props.submissionSourceId,
		});
		if (!source.submissionSource) {
			throw new NotFoundError(
				`Submission source with id ${_props?.submissionSourceId} not found`,
			);
		}

		const keyId = this.deps.uuid.generate();

		// generate jwt payload
		const payload: KeyPayload = {
			id: keyId,
			sourceId: source.submissionSource.id,
			sourceName: source.submissionSource.name,
		};

		const key = await this.deps.jwt.sign(payload, {
			ttl: this.deps.clock.duration("10y"),
		});

		const newKey = {
			id: keyId,
			sourceId: source.submissionSource.id,
			sourceName: source.submissionSource.name,
			key: key,
			isValid: true,
			createdAt: this.deps.clock.now(),
		};

		await this.deps.keyRepo.saveKey(newKey);

		return { key: key };
	}
}
