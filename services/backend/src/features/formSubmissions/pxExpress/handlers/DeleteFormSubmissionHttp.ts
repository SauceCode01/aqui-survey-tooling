import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { DeleteFormSubmission } from "../../useCases/DeleteFormSubmission.js";

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

const deleteFormSubmissionHttpSchema = z.object({
	formSubmissionId: z.string(),
});

@MakeInjectable
export default class DeleteFormSubmissionHttp extends ExpressRoute {
	public static deps = {
		deleteFormSubmission: DeleteFormSubmission,
	};

	constructor(public deps: DepsType<typeof DeleteFormSubmissionHttp.deps>) {
		super();
	}

	public method = "delete" as const;
	public path = "/:formSubmissionId";
	public handler = async (req: Request, res: Response) => {
		const parsed = deleteFormSubmissionHttpSchema.safeParse(req.params);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.deleteFormSubmission.execute(parsed.data);
		return res.status(200).json({
			status: "success",
			message: "FormSubmission deleted successfully",
			data: result,
		});
	};
}
