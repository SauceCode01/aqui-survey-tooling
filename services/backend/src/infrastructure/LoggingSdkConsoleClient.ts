import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { LoggingSdk } from "@/modules/Logging/LoggingSdk.js";

@MakeInjectable
export class LoggingSdkConsoleClient {
	public static deps = {};

	public client: LoggingSdk;

	constructor(public deps: DepsType<typeof LoggingSdkConsoleClient.deps>) {
		this.client = new LoggingSdk({
			options: {
				configs: [
					{
						mode: "console",
					},
				],
				ignoredDirs: [],
			},
		});
	}
}
