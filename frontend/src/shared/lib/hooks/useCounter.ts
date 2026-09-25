import { useCallback, useState } from "react";

export interface UseCounterOptions {
	initialValue?: number;
	min?: number;
	max?: number;
	step?: number;
}

export function useCounter(options: UseCounterOptions = {}) {
	const {
		initialValue = 0,
		min = -Infinity,
		max = Infinity,
		step = 1,
	} = options;
	const [count, setCount] = useState(initialValue);

	const increment = useCallback(() => {
		setCount((prev) => Math.min(prev + step, max));
	}, [step, max]);

	const decrement = useCallback(() => {
		setCount((prev) => Math.max(prev - step, min));
	}, [step, min]);

	const reset = useCallback(() => {
		setCount(initialValue);
	}, [initialValue]);

	const set = useCallback(
		(value: number) => {
			setCount(Math.min(Math.max(value, min), max));
		},
		[min, max],
	);

	return {
		count,
		increment,
		decrement,
		reset,
		set,
	};
}
