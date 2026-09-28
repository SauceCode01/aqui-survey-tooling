import { spawnSync } from "node:child_process";
import { setupMeshNetwork, teardownAll, getBootOrder, bootService, mesh } from "./mesh-utils.js";

process.on("SIGINT", () => { teardownAll(); process.exit(1); });
process.on("SIGTERM", () => { teardownAll(); process.exit(1); });

try {
  const bootOrder = getBootOrder();

  // 1. ISOLATED UNIT TESTS
  console.log(`\n========================================`);
  console.log(`🧪 STAGE 1: ISOLATED SUBMODULE TESTING`);
  console.log(`========================================`);
  for (const serviceName of bootOrder) {
    const config = mesh.services[serviceName];
    console.log(`\n-> Running Unit Tests for [${serviceName}]...`);
    const { status } = spawnSync("make", ["test-unit"], { cwd: config.path, stdio: "inherit" });
    if (status !== 0) {
        console.error(`🚨 Unit tests failed for ${serviceName}`);
        process.exit(1);
    }
  }

  // 2. INTEGRATED PRODUCTION BOOTUP
  console.log(`\n========================================`);
  console.log(`🏭 STAGE 2: PRODUCTION MESH BOOTUP`);
  console.log(`========================================`);
  setupMeshNetwork();
  for (const serviceName of bootOrder) {
    bootService(serviceName, "prod");
  }

  // 3. GLOBAL E2E PLAYWRIGHT SUITE
  console.log(`\n========================================`);
  console.log(`🚦 STAGE 3: GLOBAL E2E ASSERTIONS`);
  console.log(`========================================`);
  
  const { status: e2eStatus } = spawnSync("docker", [
    "compose", 
    "-f", ".docker/docker-compose.global-e2e.yml", 
    "up", "--build", 
    "--abort-on-container-exit", 
    "--exit-code-from", "global-e2e"
  ], { stdio: "inherit" });

  process.exitCode = e2eStatus ?? 1;

} finally {
  teardownAll();
}