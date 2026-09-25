import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { UpdateFormSubmission } from "../../useCases/UpdateFormSubmission.js";

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

const updateFormSubmissionHttpSchema = z.object({
	formSubmission: z.any(),
});

@MakeInjectable
export default class UpdateFormSubmissionHttp extends ExpressRoute {
	public static deps = {
		updateFormSubmission: UpdateFormSubmission,
	};

	constructor(public deps: DepsType<typeof UpdateFormSubmissionHttp.deps>) {
		super();
	}

	public method = "put" as const;
	public path = "/:formSubmissionId";
	public handler = async (req: Request, res: Response) => {
		const parsed = updateFormSubmissionHttpSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.updateFormSubmission.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "FormSubmission updated successfully",
			data: result,
		});
	};
}
