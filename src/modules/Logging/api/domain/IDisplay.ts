import type { LogEntry } from "./LogEntry.js";

export interface IDisplay {
	display(entry: LogEntry): Promise<{ ok: boolean }>;
}
