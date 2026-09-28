// scripts/ci/run-mesh-prod.ts
import { setupMeshNetwork, teardownAll, getBootOrder, bootService, tailLogs } from "./mesh-utils.js";

const handleShutdown = () => {
  teardownAll();
  process.exit(0);
};

// Intercept Ctrl+C to trigger graceful nuclear teardown
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

try {
  setupMeshNetwork();
  
  const bootOrder = getBootOrder();
  
  for (const serviceName of bootOrder) {
    // Passes "prod" so Docker builds using the 'prod' Dockerfile target 
    // and loads the .env.prod configuration files
    bootService(serviceName, "prod");
  }

  console.log(`\n🚀 Global Production Environment Online. Streaming logs...`);
  console.log(`(Press Ctrl+C to safely stop and tear down all containers)\n`);
  
  tailLogs(); 

} catch (err) {
  console.error(err);
  handleShutdown();
}