import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { CreateFormSubmission } from "../../useCases/CreateFormSubmission.js";

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

const createFormSubmissionHttpSchema = z.object({
	data: z.object({
		email: z.string(),
		formData: z.any(),
	}),
});

@MakeInjectable
export default class CreateFormSubmissionHttp extends ExpressRoute {
	public static deps = {
		createFormSubmission: CreateFormSubmission,
	};

	constructor(public deps: DepsType<typeof CreateFormSubmissionHttp.deps>) {
		super();
	}

	public method = "post" as const;
	public path = "/";
	public handler = async (req: Request, res: Response) => {
		const parsed = createFormSubmissionHttpSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.createFormSubmission.execute({
			createDto: {
				email: parsed.data.data.email,
				answers: parsed.data.data.formData,
			},
		});
		return res.status(201).json({
			status: "success",
			message: "FormSubmission created successfully",
			data: {
				id: result.formSubmission.id,
				email: result.formSubmission.email,
			},
		});
	};
}
