export const colorValues = {
	reset: "\x1b[0m",
	default: "\x1b[0m",
	gray: "\x1b[90m",
	mediumDarkGray: "\x1b[38;5;238m",
	darkGray: "\x1b[38;5;236m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	blue: "\x1b[34m",
	white: "\x1b[37m",
} as const;

export type Color = keyof typeof colorValues;
