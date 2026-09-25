import { startOnly } from "@solid-stack/agnos";
import type { Container } from "@solid-stack/di";

export const startAgnos = async (c: Container) => {
	// start agnos
	await startOnly(c);
};
