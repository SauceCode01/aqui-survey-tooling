import type { Color } from "./Colors.js";
import type { LogLevel } from "./LogLevel.js";

export interface LogEntry {
	level: LogLevel;
	levelColor: Color;
	message: unknown[];
	timestamp?: string;
	prefix?: string;
	lineInfo: string;
}
