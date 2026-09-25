import { ExpressRoute } from "@solid-stack/agnos-express";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import type { Request, Response } from "express";

@MakeInjectable
export default class Health extends ExpressRoute {
	public static deps = {};
	constructor(public deps: DepsType<typeof Health.deps>) {
		super();
	}

	public method = "get" as const;
	public path = "/";
	public handler = async (_req: Request, res: Response) => {
		res.status(200).json({ status: "success" });
	};
}
