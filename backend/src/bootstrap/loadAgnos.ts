import path from "node:path";
import { loadOnly } from "@solid-stack/agnos";
import type { Container } from "@solid-stack/di";

export const loadAgnos = async (c: Container) => {
	// load agnos
	await loadOnly(c, {
		featuresDir: path.resolve(import.meta.dirname, "../features"),
		sharedDir: path.resolve(import.meta.dirname, "../shared"),
	});
};
