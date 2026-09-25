import { Container } from "@solid-stack/di";
import { loadAgnos } from "@/bootstrap/loadAgnos.js";
import { loadCore } from "@/bootstrap/loadCore.js";

export const createTestContainer = async (): Promise<Container> => {
	const c = new Container();
	await loadCore(c);
	await loadAgnos(c);
	return c;
};
