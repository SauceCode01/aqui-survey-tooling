import {
  setupMeshNetwork,
  teardownAll,
  getBootOrder,
  bootService,
  tailLogs,
  currentRunCtx,
} from "./mesh-utils.js";

let shuttingDown = false;

const handleSignal = async (signal: "SIGINT" | "SIGTERM") => {
  if (shuttingDown) {
    console.log(`\n⏳ Teardown is currently in progress, waiting for Docker to finish...`);
    return;
  }
  shuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Initiating graceful teardown...`);
  try {
    await teardownAll(currentRunCtx);
  } finally {
    console.log(`🏁 All services and networks cleanly stopped. Exiting.\n`);
    process.exit(signal === "SIGINT" ? 130 : 143);
  }
};

process.on("SIGINT", () => handleSignal("SIGINT"));
process.on("SIGTERM", () => handleSignal("SIGTERM"));

async function main() {
  try {
    await setupMeshNetwork(currentRunCtx);

    const bootOrder = getBootOrder();

    for (const serviceName of bootOrder) {
      await bootService(serviceName, "dev", currentRunCtx);
    }

    console.log(`\n🚀 Global Dev Environment Online. Streaming logs...`);
    console.log(`(Press Ctrl+C to safely stop and tear down all containers)\n`);

    tailLogs(currentRunCtx);
  } catch (err: any) {
    console.error(`🚨 Fatal Dev Mesh Error: ${err.message || err}`);
    process.exitCode = 1;
    await teardownAll(currentRunCtx);
    process.exit(1);
  }
}

main();