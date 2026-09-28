import { AgnosInputParsingError as InputParsingError } from "@solid-stack/agnos";
import z from "zod";

export const parseInbound = <T extends z.ZodTypeAny>(
	schema: T,
	data: unknown,
): z.infer<T> => {
	try {
		return schema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const formattedErrors = error.issues.map((err) => ({
				field: err.path.join("."),
				message: err.message,
			}));
			throw new InputParsingError(
				`Input parsing failed: ${JSON.stringify(formattedErrors)}`,
			);
		}

		throw new InputParsingError(
			`Input parsing failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
};
