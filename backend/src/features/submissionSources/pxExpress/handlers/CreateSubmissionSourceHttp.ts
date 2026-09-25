import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { CreateSubmissionSource } from "../../useCases/CreateSubmissionSource.js";

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

const createSubmissionSourceHttpSchema = z.object({
	submissionSource: z.object({
		name: z.string(),
	}),
});

@MakeInjectable
export default class CreateSubmissionSourceHttp extends ExpressRoute {
	public static deps = {
		createSubmissionSource: CreateSubmissionSource,
	};

	constructor(public deps: DepsType<typeof CreateSubmissionSourceHttp.deps>) {
		super();
	}

	public method = "post" as const;
	public path = "/";
	public handler = async (req: Request, res: Response) => {
		const parsed = createSubmissionSourceHttpSchema.safeParse({
			submissionSource: req.body.data,
		});
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.createSubmissionSource.execute({
			submissionSource: parsed.data.submissionSource,
		});

		return res.status(201).json({
			status: "success",
			message: "SubmissionSource created successfully",
			data: {
				id: result.submissionSource.id,
			},
		});
	};
}
