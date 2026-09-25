import { colorValues } from "../domain/Colors.js";

export function applyColor(
	text: string,
	color: keyof typeof colorValues,
): string {
	return colorValues[color] + text + colorValues.reset;
}
