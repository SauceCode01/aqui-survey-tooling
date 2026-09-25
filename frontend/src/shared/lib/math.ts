/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the percentage of a part in relation to a total.
 */
export function calculatePercentage(part: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((part / total) * 100);
}
