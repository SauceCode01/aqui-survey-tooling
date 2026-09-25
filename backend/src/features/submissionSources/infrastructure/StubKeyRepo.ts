import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { IKeyRepo, Key } from "../domain/IKeyRepo.js";

@MakeInjectable
export class StubKeyRepo implements IKeyRepo {
	public static deps = {};
	private keys: Map<string, Key> = new Map();

	constructor(public deps: DepsType<typeof StubKeyRepo.deps>) {}

	async saveKey(key: Key): Promise<void> {
		this.keys.set(key.id, { ...key });
	}

	async getKeyById(id: string): Promise<Key | null> {
		const found = this.keys.get(id);
		return found ? { ...found } : null;
	}

	async listKeys(sourceId?: string): Promise<Key[]> {
		const all = Array.from(this.keys.values()).map((k) => ({ ...k }));
		if (sourceId) {
			return all.filter((k) => k.sourceId === sourceId);
		}
		return all;
	}

	async revokeKey(id: string): Promise<void> {
		const found = this.keys.get(id);
		if (found) {
			found.isValid = false;
		}
	}
}
