import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { DeleteSubmissionSource } from "../../useCases/DeleteSubmissionSource.js";

const deleteSubmissionSourceSchema = z.object({
	submissionSourceId: z.string(),
});

@MakeInjectable
export default class DeleteSubmissionSourceHttp extends ExpressRoute {
	public static deps = {
		deleteSubmissionSource: DeleteSubmissionSource,
	};

	constructor(public deps: DepsType<typeof DeleteSubmissionSourceHttp.deps>) {
		super();
	}

	public method = "delete" as const;
	public path = "/:submissionSourceId";
	public handler = async (req: Request, res: Response) => {
		const parsed = deleteSubmissionSourceSchema.safeParse(req.params);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.deleteSubmissionSource.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "SubmissionSource deleted successfully",
			data: result,
		});
	};
}
