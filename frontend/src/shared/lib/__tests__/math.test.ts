import { describe, expect, it } from "vitest";
import { calculatePercentage, clamp } from "../math.js";

describe("Math utils", () => {
	describe("clamp", () => {
		it("clamps value within min and max", () => {
			expect(clamp(15, 0, 10)).toBe(10);
			expect(clamp(-5, 0, 10)).toBe(0);
			expect(clamp(5, 0, 10)).toBe(5);
		});
	});

	describe("calculatePercentage", () => {
		it("calculates percentage correctly", () => {
			expect(calculatePercentage(25, 100)).toBe(25);
			expect(calculatePercentage(1, 3)).toBe(33);
		});

		it("returns 0 if total is 0", () => {
			expect(calculatePercentage(50, 0)).toBe(0);
		});
	});
});
