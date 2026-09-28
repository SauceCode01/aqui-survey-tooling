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
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Initiating graceful teardown...`);
  try {
    await teardownAll(currentRunCtx);
  } finally {
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
      await bootService(serviceName, "prod", currentRunCtx);
    }

    console.log(`\n🚀 Global Production Environment Online. Streaming logs...`);
    console.log(`(Press Ctrl+C to safely stop and tear down all containers)\n`);

    tailLogs(currentRunCtx);
  } catch (err: any) {
    console.error(`🚨 Fatal Prod Mesh Error: ${err.message || err}`);
    process.exitCode = 1;
    await teardownAll(currentRunCtx);
    process.exit(1);
  }
}

main();