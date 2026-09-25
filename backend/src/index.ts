import { Container } from "@solid-stack/di";
import { loadAgnos } from "./bootstrap/loadAgnos.js";
import { loadCore } from "./bootstrap/loadCore.js";
import { startAgnos } from "./bootstrap/startAgnos.js";

async function main() {
	try {
		// creating app container
		const c: Container = new Container();
		await loadCore(c);
		await loadAgnos(c);
		await startAgnos(c);

		// Handle graceful shutdown signals from Docker
		process.on("SIGTERM", () => {
			console.log("Received SIGTERM, shutting down gracefully...");
			process.exit(0);
		});
		process.on("SIGINT", () => {
			console.log("Received SIGINT, shutting down gracefully...");
			process.exit(0);
		});
	} catch (err) {
		console.error(
			"An unhandled error occurred while starting the application:",
			err,
		);
		process.exit(1);
	}
}

main();
