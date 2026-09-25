import path from "node:path";
import type { IDisplay } from "../api/domain/IDisplay.js";
import { DisplayConsole } from "../api/infrastructure/DisplayConsole.js";
import { DisplayLoggerApi } from "../api/infrastructure/DisplayLoggerApi.js";
import { FileInfoCheap } from "../api/infrastructure/FileInfoCheap.js";
import { Log } from "../api/use-cases/Log.js";
import type { LogFn } from "../interfaces/LogFn.js";
import type { LoggerConfig } from "../types/LoggerConfig.js";

export const makeLogFn = (deps: {
	config: LoggerConfig;
	ignoredDirs: string[];
}) => {
	const config = deps.config;
	const fileInfo = new FileInfoCheap([
		path.resolve(import.meta.dirname, ".."),
		...deps.ignoredDirs,
	]);
	const display: IDisplay = (() => {
		if (config.mode === "console") {
			return new DisplayConsole();
		} else if (config.mode === "api") {
			const url = config.url;
			if (!url) throw new Error("API url not provided.");
			if (!fetch) throw new Error("Fetch not provided.");
			return new DisplayLoggerApi({ url: url, fetch: fetch });
		} else {
			throw new Error("Mode did not match any valid modes.");
		}
	})();

	const logUc = new Log({
		fileInfo,
		display,
	});

	const logFn: LogFn = (message, level) => {
		logUc.execute({ message, level });
	};

	return logFn;
};
