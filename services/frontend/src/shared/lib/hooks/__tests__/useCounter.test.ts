import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCounter } from "../useCounter.js";

describe("useCounter hook", () => {
	it("should initialize with default value 0", () => {
		const { result } = renderHook(() => useCounter());
		expect(result.current.count).toBe(0);
	});

	it("should initialize with custom initial value", () => {
		const { result } = renderHook(() => useCounter({ initialValue: 10 }));
		expect(result.current.count).toBe(10);
	});

	it("should increment and decrement correctly", () => {
		const { result } = renderHook(() =>
			useCounter({ initialValue: 5, step: 2 }),
		);

		act(() => {
			result.current.increment();
		});
		expect(result.current.count).toBe(7);

		act(() => {
			result.current.decrement();
		});
		expect(result.current.count).toBe(5);
	});

	it("should respect min and max bounds", () => {
		const { result } = renderHook(() =>
			useCounter({ initialValue: 5, min: 0, max: 10 }),
		);

		act(() => {
			result.current.set(20);
		});
		expect(result.current.count).toBe(10);

		act(() => {
			result.current.set(-5);
		});
		expect(result.current.count).toBe(0);
	});

	it("should reset to initial value", () => {
		const { result } = renderHook(() => useCounter({ initialValue: 42 }));

		act(() => {
			result.current.increment();
			result.current.increment();
		});
		expect(result.current.count).toBe(44);

		act(() => {
			result.current.reset();
		});
		expect(result.current.count).toBe(42);
	});
});
