import { type DepsType, MakeInjectable } from "@solid-stack/di";
import z from "zod";
import { AppError } from "@/errors/AppError.js";
import { FirebaseClient } from "@/infrastructure/FirebaseClient.js";
import { Clock } from "@/shared/time/Clock.js";
import type { IKeyRepo, Key } from "../domain/IKeyRepo.js";

@MakeInjectable
export class FirebaseKeyRepo implements IKeyRepo {
	public static deps = {
		fbClient: FirebaseClient,
		clock: Clock,
	};
	constructor(public readonly deps: DepsType<typeof FirebaseKeyRepo.deps>) {}

	async saveKey(key: Key): Promise<void> {
		await this.deps.fbClient.createWithCustomId(
			"submissionSourceKeys",
			key.id,
			{
				...key,
				createdAt: this.deps.clock.toIso(key.createdAt),
			},
		);
	}

	async getKeyById(id: string): Promise<Key | null> {
		const doc = await this.deps.fbClient.getDocumentById(
			"submissionSourceKeys",
			id,
		);
		if (!doc) {
			return null;
		}
		const data = doc 

		// validate data
		const schema = z.object({
			id: z.string(),
			sourceId: z.string(),
			sourceName: z.string(),
			key: z.string(),
			isValid: z.boolean(),
			createdAt: z.string().datetime(),
		});

		const parsed = schema.safeParse(data);

		if (!parsed.success) {
			throw new AppError(
				`Key found but has invalid shape: ${parsed.error.message}`,
			);
		}

		return {
			id: data.id,
			sourceId: data.sourceId,
			sourceName: data.sourceName,
			key: data.key,
			isValid: data.isValid,
			createdAt: this.deps.clock.fromIso(data.createdAt),
		};
	}
}
