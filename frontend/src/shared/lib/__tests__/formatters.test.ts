import { describe, expect, it } from "vitest";
import { capitalize, formatCurrency, truncate } from "../formatters.js";

describe("Formatter utils", () => {
	describe("formatCurrency", () => {
		it("formats USD currency correctly", () => {
			const formatted = formatCurrency(1234.56, "USD", "en-US");
			expect(formatted).toBe("$1,234.56");
		});
	});

	describe("truncate", () => {
		it("returns string as-is if shorter than max", () => {
			expect(truncate("Hello", 10)).toBe("Hello");
		});

		it("truncates and appends ellipsis if longer than max", () => {
			expect(truncate("Hello World Today", 11)).toBe("Hello World...");
		});
	});

	describe("capitalize", () => {
		it("capitalizes the first character", () => {
			expect(capitalize("solid stack")).toBe("Solid stack");
		});

		it("handles empty strings", () => {
			expect(capitalize("")).toBe("");
		});
	});
});
