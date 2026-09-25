import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IFileInfo } from "../domain/IFileInfo.js";

export class FileInfoCheap implements IFileInfo {
	private readonly normalizedIgnoredPaths: string[];

	constructor(ignoredPaths: string[] = []) {
		this.normalizedIgnoredPaths = [];

		// Process user-provided paths (can be exact files or directories)
		for (const p of ignoredPaths) {
			const absolutePath = path.resolve(p);
			let normalized = absolutePath.replace(/\\/g, "/");

			// If the path doesn't have a file extension, treat it as a directory
			// and append a trailing slash for strict folder matching.
			if (path.extname(normalized) === "") {
				if (!normalized.endsWith("/")) {
					normalized += "/";
				}
			}

			this.normalizedIgnoredPaths.push(normalized);
		}
	}

	getFileInfo(): string {
		const originalPrepare = Error.prepareStackTrace;

		try {
			Error.prepareStackTrace = (_, stack) => stack;

			const err = new Error();
			Error.captureStackTrace(err, this.getFileInfo);

			const stack = err.stack as unknown as NodeJS.CallSite[];

			for (const callSite of stack) {
				const file = callSite.getFileName();

				if (!file || file.startsWith("node:")) continue;

				let normalizedFile = file;

				if (normalizedFile.startsWith("file://")) {
					normalizedFile = fileURLToPath(normalizedFile);
				}

				normalizedFile = normalizedFile.replace(/\\/g, "/");

				// SKIP: If the file path starts with any of our ignored paths
				const shouldIgnore = this.normalizedIgnoredPaths.some((prefix) =>
					normalizedFile.startsWith(prefix),
				);

				if (shouldIgnore) continue;

				const line = callSite.getLineNumber() ?? 0;
				const normalizedCwd = process.cwd().replace(/\\/g, "/");

				let shortFile = normalizedFile;

				if (normalizedFile.startsWith(normalizedCwd)) {
					shortFile = normalizedFile
						.substring(normalizedCwd.length)
						.replace(/^\//, "");
				}

				return `${shortFile}:${line}`;
			}

			return "unknown:0";
		} finally {
			Error.prepareStackTrace = originalPrepare;
		}
	}
}
