import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { IKeyRepo } from "../domain/IKeyRepo.js";

export type RevokeSourceKeyInput = {
	keyId: string;
};

export type RevokeSourceKeyOutput = {
	success: boolean;
};

@MakeInjectable
export class RevokeSourceKey {
	public static deps = {
		keyRepo: IKeyRepo,
	};

	constructor(public deps: DepsType<typeof RevokeSourceKey.deps>) {}

	async execute(props: RevokeSourceKeyInput): Promise<RevokeSourceKeyOutput> {
		await this.deps.keyRepo.revokeKey(props.keyId);
		return { success: true };
	}
}
