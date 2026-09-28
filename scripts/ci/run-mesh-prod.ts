import { setupMeshNetwork, teardownAll, getBootOrder, bootService, tailLogs } from "./mesh-utils.js";

process.on("SIGINT", () => { teardownAll(); process.exit(1); });
process.on("SIGTERM", () => { teardownAll(); process.exit(1); });

try {
  setupMeshNetwork();
  
  const bootOrder = getBootOrder();
  for (const serviceName of bootOrder) {
    bootService(serviceName, "prod");
  }

  console.log(`\n🚀 Global Production Environment Online.`);
  tailLogs();

} catch (err) {
  console.error(err);
  teardownAll();
  process.exit(1);
}