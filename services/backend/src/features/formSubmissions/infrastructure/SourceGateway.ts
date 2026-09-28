import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { ValidateSourceKey } from "@/features/submissionSources/useCases/ValidateSourceKey.js";
import type { ISourceGateway } from "../domain/ISourceGateway.js";

@MakeInjectable
export class SourceGateway implements ISourceGateway {
	public static deps = {
		validate: ValidateSourceKey,
	};
	constructor(public readonly deps: DepsType<typeof SourceGateway.deps>) {}

	async validateKey(input: {
		key: string;
	}): Promise<{ isValid: boolean; sourceId: string }> {
		const key = input.key;
		const res = await this.deps.validate.execute({ key });
		const isValid = res.success;
		const sourceId = res.payload.sourceId;
		return { isValid: isValid, sourceId: sourceId };
	}
}
