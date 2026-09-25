import type { LogLevel } from "./api/domain/LogLevel.js";
import { makeLogFn } from "./factories/makeLogFn.js";
import type { LogFn } from "./interfaces/LogFn.js";
import type { LoggerConfig } from "./types/LoggerConfig.js";

export class LoggingSdk {
	private configs: LoggerConfig[];
	private logFns: LogFn[];
	private isInit: boolean = false;
	private ignoredDirs: string[] = [];

	constructor(deps: {
		options: {
			configs: LoggerConfig[];
			ignoredDirs: string[];
		};
	}) {
		this.configs = deps.options.configs;
		this.logFns = [];
		this.ignoredDirs = deps.options.ignoredDirs;

		this.configs.forEach((val) => {
			const logFn = makeLogFn({ config: val, ignoredDirs: this.ignoredDirs });
			this.logFns.push(logFn);
		});

		this.isInit = true;
	}

	private triggerLogFns(message: unknown[], level: LogLevel) {
		if (!this.isInit) throw new Error("LoggerSdk is uninitialized");
		this.logFns.forEach((logFn) => {
			logFn(message, level);
		});
	}

	log(...args: unknown[]): void {
		this.triggerLogFns(args, "log");
	}
	info(...args: unknown[]): void {
		this.triggerLogFns(args, "info");
	}
	warn(...args: unknown[]): void {
		this.triggerLogFns(args, "warn");
	}
	error(...args: unknown[]): void {
		this.triggerLogFns(args, "error");
	}
	debug(...args: unknown[]): void {
		this.triggerLogFns(args, "debug");
	}
}
