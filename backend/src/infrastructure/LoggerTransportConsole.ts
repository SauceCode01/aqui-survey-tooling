import type { ILoggerTransport, LogLevel } from "@solid-stack/agnos";
import { type DepsType, MakeInjectable } from "@solid-stack/di";
import { LoggingSdkConsoleClient } from "./LoggingSdkConsoleClient.js";

@MakeInjectable
export class LoggerTransportConsole implements ILoggerTransport {
	public static deps = { loggingSDkConsoleClient: LoggingSdkConsoleClient };
	constructor(public deps: DepsType<typeof LoggerTransportConsole.deps>) {}

	push(message: unknown[], level: LogLevel) {
		this.deps.loggingSDkConsoleClient.client[level](...message);
	}
}
