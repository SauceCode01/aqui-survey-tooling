import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { GetFormSubmission } from "../../useCases/GetFormSubmission.js";

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

const getFormSubmissionHttpSchema = z.object({
	formSubmissionId: z.string(),
});

@MakeInjectable
export default class GetFormSubmissionHttp extends ExpressRoute {
	public static deps = {
		getFormSubmission: GetFormSubmission,
	};

	constructor(public deps: DepsType<typeof GetFormSubmissionHttp.deps>) {
		super();
	}

	public method = "get" as const;
	public path = "/:formSubmissionId";
	public handler = async (req: Request, res: Response) => {
		const parsed = getFormSubmissionHttpSchema.safeParse(req.params);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.getFormSubmission.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "FormSubmission retrieved successfully",
			data: result,
		});
	};
}
