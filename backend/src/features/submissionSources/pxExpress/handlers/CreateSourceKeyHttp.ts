import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import z from "zod";
import { CreateSourceKey } from "../../useCases/CreateSourceKey.js";

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

const schema = z.object({
	body: z.object({
		data: z.object({
			id: z.string(),
		}),
	}),
});

@MakeInjectable
export default class CreateSourceKeyHttp extends ExpressRoute {
	public static deps = {
		createSourceKey: CreateSourceKey,
	};

	constructor(public deps: DepsType<typeof CreateSourceKeyHttp.deps>) {
		super();
	}

	public method = "post" as const;
	public path = "/submissionsources";
	public handler = async (req: Request, res: Response) => {
		const parsed = schema.safeParse({
			body: req.body,
		});
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}

		const result = await this.deps.createSourceKey.execute({
			submissionSourceId: parsed.data.body.data.id,
		});

		return res.status(201).json({
			status: "success",
			message: "SourceKey created successfully",
			data: result,
		});
	};
}
