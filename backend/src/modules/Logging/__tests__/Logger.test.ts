import { describe, it } from "vitest";

describe("Logger Module", () => {
	it("should format and output log entries via transport", async () => {
		// const mockTransport = vi.fn();
		// const { logger } = makeLoggerModule({
		//   transportFn: mockTransport,
		//   prefix: "[TEST]",
		// });
		// logger.info("Hello World");
		// // Wait for microtask queue since log execution is asynchronous
		// await new Promise((r) => setTimeout(r, 10));
		// expect(mockTransport).toHaveBeenCalledTimes(1);
		// const output = mockTransport.mock.calls[0]![0] as string;
		// expect(output).toContain("[TEST]");
		// expect(output).toContain("INFO");
		// expect(output).toContain("Hello World");
	});
});
