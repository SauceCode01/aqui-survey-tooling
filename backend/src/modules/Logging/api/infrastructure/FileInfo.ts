import type { IFileInfo } from "../domain/IFileInfo.js";

export class FileInfo implements IFileInfo {
	getFileInfo(): string {
		const stackDepth = 5;

		const error = new Error();
		const stack = error.stack?.split("\n");
		const callerLine = stack?.[stackDepth];

		if (!callerLine) return "unknown:0";

		const match = callerLine.match(
			/(?:at\s+.+\s+\()?(?:file:\/\/\/)?([^:]+):(\d+):\d+\)?/,
		);

		if (match) {
			const file = match[1];
			const line = match[2];

			if (!file || !line) return "unknown:0";

			const normalizedFile = file.replace(/\\/g, "/");
			const normalizedCwd = process.cwd().replace(/\\/g, "/");

			const noDriveFile = normalizedFile.replace(/^[a-zA-Z]:/, "");
			const noDriveCwd = normalizedCwd.replace(/^[a-zA-Z]:/, "");

			let shortFile = noDriveFile;
			if (noDriveFile.startsWith(noDriveCwd)) {
				shortFile = noDriveFile.substring(noDriveCwd.length);
			}

			return `${shortFile}:${line}`.trim();
		}

		return "unknown:0";
	}
}
