export abstract class ISourceGateway {
	abstract validateKey(input: {
		key: string;
	}): Promise<{ isValid: boolean; sourceId: string }>;
}
