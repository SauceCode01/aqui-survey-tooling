import { spawnSync } from "node:child_process";
import { getMocks, getOverride } from "./utils.js";

const composeFiles = [
  "-f", ".docker/core/docker-compose.base.yml",
  "-f", ".docker/core/docker-compose.prod.yml",
  "-f", ".docker/core/docker-compose.e2e.yml",
  ...getMocks(),
  ...getOverride("prod"),
  ...getOverride("e2e"),
];

const cleanup = () => {
  console.log(`🧹 Cleaning up E2E environment...`);
  spawnSync("docker", [
    "compose", 
    "--env-file", ".env.test", 
    ...composeFiles, 
    "down", "-v"
  ], { stdio: "inherit" });
};

// Guarantee cleanup even if the developer interrupts the process (Ctrl+C)
process.on("SIGINT", () => { cleanup(); process.exit(1); });
process.on("SIGTERM", () => { cleanup(); process.exit(1); });

console.log(`🚀 Booting E2E Environment (App in Prod Mode + Dynamic Mocks)...`);
const runArgs = [
  "compose", 
  "--env-file", ".env.test", 
  ...composeFiles, 
  "up", "--build", 
  "--abort-on-container-exit", 
  "--exit-code-from", "test-e2e"
];

try {
  const { status } = spawnSync("docker", runArgs, { stdio: "inherit" });
  // Pass the Docker exit code to the Node process so CI knows if tests failed
  process.exitCode = status ?? 1; 
} finally {
  cleanup();
}