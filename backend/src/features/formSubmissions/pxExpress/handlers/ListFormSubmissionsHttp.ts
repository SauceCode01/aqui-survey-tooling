import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { ListFormSubmissions } from "../../useCases/ListFormSubmissions.js";

export type HttpResponseStatus =
	| "info"
	| "success"
	| "redirect"
	| "fail"
	| "error";

export interface HttpResponse<T = object> {
	status: HttpResponseStatus;
	message: string;
	data?: T;
}

const listFormSubmissionsHttpSchema = z.object({
	page: z.coerce.number().optional(),
	limit: z.coerce.number().optional(),
});

@MakeInjectable
export default class ListFormSubmissionsHttp extends ExpressRoute {
	public static deps = {
		listFormSubmissions: ListFormSubmissions,
	};

	constructor(public deps: DepsType<typeof ListFormSubmissionsHttp.deps>) {
		super();
	}

	public method = "get" as const;
	public path = "/";
	public handler = async (req: Request, res: Response) => {
		const parsed = listFormSubmissionsHttpSchema.safeParse(req.query);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.listFormSubmissions.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "FormSubmissions retrieved successfully",
			data: result,
		});
	};
}
