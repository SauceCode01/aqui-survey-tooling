import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { GetSubmissionSource } from "../../useCases/GetSubmissionSource.js";

const getSubmissionSourceSchema = z.object({
	submissionSourceId: z.string(),
});

@MakeInjectable
export default class GetSubmissionSourceHttp extends ExpressRoute {
	public static deps = {
		getSubmissionSource: GetSubmissionSource,
	};

	constructor(public deps: DepsType<typeof GetSubmissionSourceHttp.deps>) {
		super();
	}

	public method = "get" as const;
	public path = "/:submissionSourceId";
	public handler = async (req: Request, res: Response, next: NextFunction) => {
		if (req.params.submissionSourceId === "keys") {
			return next();
		}
		const parsed = getSubmissionSourceSchema.safeParse(req.params);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.getSubmissionSource.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "SubmissionSource retrieved successfully",
			data: result,
		});
	};
}
