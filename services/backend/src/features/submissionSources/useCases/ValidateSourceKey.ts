import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { AppError } from "@/errors/AppError.js";
import { Jwt } from "@/shared/jwt/Jwt.js";
import { Clock } from "@/shared/time/Clock.js";
import { Uuid } from "@/shared/uuid/Uuid.js";
import { IKeyRepo, type KeyPayload } from "../domain/IKeyRepo.js";
import { ISubmissionSourceRepository } from "../domain/ISubmissionSourceRepository.js";

export type ValidateSourceKeyInput = { key: string };

export type ValidateSourceKeyOutput = {
	success: boolean;
	payload: KeyPayload;
};

@MakeInjectable
export class ValidateSourceKey {
	public static deps = {
		repo: ISubmissionSourceRepository,
		jwt: Jwt,
		clock: Clock,
		uuid: Uuid,
		keyRepo: IKeyRepo,
	};

	constructor(public readonly deps: DepsType<typeof ValidateSourceKey.deps>) {}

	async execute(
		_props: ValidateSourceKeyInput,
	): Promise<ValidateSourceKeyOutput> {
		let validated: KeyPayload;
		try {
			validated = await this.deps.jwt.verify<KeyPayload>(_props.key);
		} catch (err) {
			throw new AppError("Failed to validated key");
		}

		// check if key is valid in the repo
		const key = await this.deps.keyRepo.getKeyById(validated.id);
		if (!key) {
			throw new AppError("Key not found");
		}

		if (!key.isValid) {
			throw new AppError("Key is not valid");
		}

		return { success: true, payload: validated };
	}
}
