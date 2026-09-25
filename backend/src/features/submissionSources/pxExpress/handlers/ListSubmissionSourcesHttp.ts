import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { ListSubmissionSources } from "../../useCases/ListSubmissionSources.js";

const listSubmissionSourcesSchema = z.object({
	page: z.coerce.number().optional(),
	limit: z.coerce.number().optional(),
});

@MakeInjectable
export default class ListSubmissionSourcesHttp extends ExpressRoute {
	public static deps = {
		listSubmissionSources: ListSubmissionSources,
	};

	constructor(public deps: DepsType<typeof ListSubmissionSourcesHttp.deps>) {
		super();
	}

	public method = "get" as const;
	public path = "/";
	public handler = async (req: Request, res: Response) => {
		const parsed = listSubmissionSourcesSchema.safeParse(req.query);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.listSubmissionSources.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "SubmissionSources retrieved successfully",
			data: result,
		});
	};
}
