"use client";

import { useCounter } from "@/shared/lib/hooks/useCounter";

export function Counter() {
	const { count, increment, decrement, reset } = useCounter({
		initialValue: 0,
	});

	return (
		<div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 my-4">
			<span className="text-sm font-medium text-zinc-500">
				Interactive Component
			</span>
			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={decrement}
					data-testid="decrement-btn"
					className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-bold hover:bg-zinc-200"
					aria-label="Decrement"
				>
					-
				</button>
				<span
					data-testid="counter-value"
					className="text-xl font-bold min-w-[2rem] text-center"
				>
					{count}
				</span>
				<button
					type="button"
					onClick={increment}
					data-testid="increment-btn"
					className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-bold hover:bg-zinc-200"
					aria-label="Increment"
				>
					+
				</button>
				<button
					type="button"
					onClick={reset}
					data-testid="reset-btn"
					className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700 underline"
				>
					Reset
				</button>
			</div>
		</div>
	);
}
