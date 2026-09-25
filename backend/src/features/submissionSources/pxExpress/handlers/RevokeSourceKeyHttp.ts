import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";
import { z } from "zod";
import { RevokeSourceKey } from "../../useCases/RevokeSourceKey.js";

const revokeSourceKeySchema = z.object({
	body: z.object({
		data: z.object({
			keyId: z.string(),
		}),
	}),
});

@MakeInjectable
export default class RevokeSourceKeyHttp extends ExpressRoute {
	public static deps = {
		revokeSourceKey: RevokeSourceKey,
	};

	constructor(public deps: DepsType<typeof RevokeSourceKeyHttp.deps>) {
		super();
	}

	public method = "post" as const;
	public path = "/revoke-key";
	public handler = async (req: Request, res: Response) => {
		const parsed = revokeSourceKeySchema.safeParse({
			body: req.body,
		});
		if (!parsed.success) {
			return res.status(400).json({
				status: "error",
				message: "Validation failed",
				data: parsed.error.format(),
			});
		}
		const result = await this.deps.revokeSourceKey.execute({
			keyId: parsed.data.body.data.keyId,
		});
		return res.status(200).json({
			status: "success",
			message: "SourceKey revoked successfully",
			data: result,
		});
	};
}
