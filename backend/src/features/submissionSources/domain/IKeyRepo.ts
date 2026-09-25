import type { Time } from "@/shared/time/domain/Time.js";

export interface Key {
	id: string;
	sourceId: string;
	sourceName: string;
	key: string;
	isValid: boolean;
	createdAt: Time;
}

export interface KeyPayload {
	id: string;
	sourceId: string;
	sourceName: string;
}

export abstract class IKeyRepo {
	abstract saveKey(key: Key): Promise<void>;
	abstract getKeyById(id: string): Promise<Key | null>;
}
