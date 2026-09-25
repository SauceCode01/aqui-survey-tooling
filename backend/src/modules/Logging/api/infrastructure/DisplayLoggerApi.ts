import type { FetchFn } from "../../interfaces/FetchFn.js";
import type { IDisplay } from "../domain/IDisplay.js";
import type { LogEntry } from "../domain/LogEntry.js";

export class DisplayLoggerApi implements IDisplay {
	private url: string;
	private fetch: FetchFn;
	constructor(opts: { url: string; fetch: FetchFn }) {
		this.url = opts.url;
		this.fetch = opts.fetch;
	}

	async display(entry: LogEntry): Promise<{ ok: boolean }> {
		const _result = await this.fetch(this.url, {
			body: JSON.stringify({
				data: entry,
			}),
		});
		return { ok: true };
	}
}
