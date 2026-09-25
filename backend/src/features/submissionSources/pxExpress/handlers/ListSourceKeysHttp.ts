import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { ListSourceKeys } from "../../useCases/ListSourceKeys.js";

const listSourceKeysSchema = z.object({
	submissionSourceId: z.string().optional(),
});

@MakeInjectable
export default class ListSourceKeysHttp extends ExpressRoute {
	public static deps = {
		listSourceKeys: ListSourceKeys,
	};

	constructor(public deps: DepsType<typeof ListSourceKeysHttp.deps>) {
		super();
	}

	public method = "get" as const;
	public path = "/keys";
	public handler = async (req: Request, res: Response) => {
		const parsed = listSourceKeysSchema.safeParse(req.query);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.listSourceKeys.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "SourceKeys retrieved successfully",
			data: result,
		});
	};
}
