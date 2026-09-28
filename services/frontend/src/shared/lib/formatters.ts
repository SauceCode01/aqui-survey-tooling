/**
 * Format a number as currency.
 */
export function formatCurrency(
	amount: number,
	currency = "USD",
	locale = "en-US",
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(amount);
}

/**
 * Truncate a string to a max length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength).trimEnd()}...`;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
}
