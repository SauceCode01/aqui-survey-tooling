import { setupMeshNetwork, teardownAll, getBootOrder, bootService, tailLogs } from "./mesh-utils.js";

// Centralized, blocking shutdown handler
const handleShutdown = () => {
  teardownAll();
  process.exit(0); // Explicitly kill the orchestrator process after teardown
};

// Intercept Ctrl+C and kill signals so Node doesn't quit prematurely
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

try {
  setupMeshNetwork();
  
  const bootOrder = getBootOrder();
  
  for (const serviceName of bootOrder) {
    bootService(serviceName, "dev");
  }

  console.log(`\n🚀 Global Dev Environment Online. Streaming logs...`);
  console.log(`(Press Ctrl+C to safely stop and tear down all containers)\n`);
  
  tailLogs(); 

} catch (err) {
  console.error(err);
  handleShutdown();
}