import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { IKeyRepo, type Key } from "../domain/IKeyRepo.js";

export type ListSourceKeysInput = {
	submissionSourceId?: string | undefined;
};

export type ListSourceKeysOutput = {
	keys: Key[];
};

@MakeInjectable
export class ListSourceKeys {
	public static deps = {
		keyRepo: IKeyRepo,
	};

	constructor(public deps: DepsType<typeof ListSourceKeys.deps>) {}

	async execute(props?: ListSourceKeysInput): Promise<ListSourceKeysOutput> {
		const keys = await this.deps.keyRepo.listKeys(props?.submissionSourceId);
		return { keys };
	}
}
