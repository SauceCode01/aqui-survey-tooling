import type { Color } from "../domain/Colors.js";
import type { IDisplay } from "../domain/IDisplay.js";
import type { LogEntry } from "../domain/LogEntry.js";
import type { LogLevel } from "../domain/LogLevel.js";
import { applyColor } from "../utils/applyColor.js";

export class DisplayConsole implements IDisplay {
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

	format(entry: LogEntry): string {
		const { timestamp, level, message, prefix } = entry;

		const parts: string[] = [];
		const trueParts: string[] = [];

		if (timestamp) {
			parts.push(applyColor(`[${timestamp}]`, "mediumDarkGray"));
		}

		if (prefix) {
			parts.push(applyColor(prefix, "mediumDarkGray"));
		}

		const lineInfo = entry.lineInfo;
		parts.push(applyColor(lineInfo, "mediumDarkGray"));

		const formattedMessages = message.map((m) => {
			if (m instanceof Error) {
				return m.stack || m.message;
			}
			return typeof m === "string" ? m : JSON.stringify(m, null, 2);
		});

		// olorize(level, level.toUpperCase(), true)
		trueParts.push(applyColor(level.toUpperCase(), entry.levelColor));
		trueParts.push(...formattedMessages);

		return `${parts.join(" ")}\n${trueParts.join(" ")}`;
	}

	async display(entry: LogEntry): Promise<{ ok: boolean }> {
		const formatted = this.format(entry);
		console.log(formatted);
		return { ok: true };
	}
}
