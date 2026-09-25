import type { Color } from "../domain/Colors.js";
import type { IDisplay } from "../domain/IDisplay.js";
import type { IFileInfo } from "../domain/IFileInfo.js";
import type { LogEntry } from "../domain/LogEntry.js";
import type { LogLevel } from "../domain/LogLevel.js";

export interface LogInput {
	message: unknown[];
	level: LogLevel;
}

export type LogOutput = undefined;

export interface ILog {
	execute(input: LogInput): Promise<LogOutput>;
}

export class Log implements ILog {
	constructor(
		private readonly deps: {
			fileInfo: IFileInfo;
			display: IDisplay;
		},
	) {}

	getLevelColor(level: LogLevel): Color {
		switch (level) {
			case "debug":
				return "gray";
			case "info":
				return "blue";
			case "warn":
				return "yellow";
			case "error":
				return "red";
			case "log":
				return "default";
			default:
				return "default";
		}
	}

	async execute(input: LogInput): Promise<LogOutput> {
		const entry: LogEntry = {
			message: input.message,
			level: input.level,
			levelColor: this.getLevelColor(input.level),
			lineInfo: "", //this.deps.fileInfo.getFileInfo(),
			timestamp: new Date().toISOString(),
			prefix: "[SERVER]",
		};
		this.deps.display.display(entry);
	}
}
