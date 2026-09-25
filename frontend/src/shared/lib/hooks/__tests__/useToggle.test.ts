import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToggle } from "../useToggle.js";

describe("useToggle hook", () => {
	it("should initialize with default false", () => {
		const { result } = renderHook(() => useToggle());
		expect(result.current[0]).toBe(false);
	});

	it("should toggle value correctly", () => {
		const { result } = renderHook(() => useToggle(false));

		act(() => {
			result.current[1]();
		});
		expect(result.current[0]).toBe(true);

		act(() => {
			result.current[1]();
		});
		expect(result.current[0]).toBe(false);
	});

	it("should explicitly set true and false", () => {
		const { result } = renderHook(() => useToggle(false));

		act(() => {
			result.current[2](); // setTrue
		});
		expect(result.current[0]).toBe(true);

		act(() => {
			result.current[3](); // setFalse
		});
		expect(result.current[0]).toBe(false);
	});
});
