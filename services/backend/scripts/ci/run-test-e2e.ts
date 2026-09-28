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

let isCleaningUp = false;

const cleanup = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n🧹 Cleaning up E2E environment...`);
  spawnSync("docker", [
    "compose", 
    "--project-directory", ".",
    "--env-file", ".env.test", 
    ...composeFiles, 
    "down", "-v", "--remove-orphans"
  ], { stdio: "inherit" });
  console.log(`🏁 All containers and networks cleanly stopped.\n`);
};

// Guarantee cleanup even if the developer interrupts the process (Ctrl+C)
process.on("SIGINT", () => {
  if (isCleaningUp) return;
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  if (isCleaningUp) return;
  cleanup();
  process.exit(143);
});

console.log(`🚀 Booting E2E Environment (App in Prod Mode + Dynamic Mocks)...`);
const runArgs = [
  "compose", 
  "--project-directory", ".",
  "--env-file", ".env.test", 
  ...composeFiles, 
  "up", "--build", 
  "--remove-orphans",
  "--force-recreate",
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