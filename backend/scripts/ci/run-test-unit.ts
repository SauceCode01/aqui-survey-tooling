import { spawnSync } from "node:child_process";
import { getOverride } from "./utils.js";

const composeFiles = [
  "-f", ".docker/core/docker-compose.base.yml",
  "-f", ".docker/core/docker-compose.test.yml",
  ...getOverride("test"),
];

const cleanup = () => {
  console.log(`🧹 Cleaning up Unit Test environment...`);
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

console.log(`🧪 Running Unit Tests (Isolated)...`);
const runArgs = [
  "compose", 
  "--env-file", ".env.test", 
  ...composeFiles, 
  "run", "--build", "--rm", "app"
];

try {
  const { status } = spawnSync("docker", runArgs, { stdio: "inherit" });
  // Pass the Docker exit code to the Node process so CI knows if tests failed
  process.exitCode = status ?? 1;
} finally {
  cleanup();
}