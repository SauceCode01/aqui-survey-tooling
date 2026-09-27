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

console.log(`🚀 Booting E2E Environment (App in Prod Mode + Dynamic Mocks)...`);
const runArgs = [
  "compose", 
  "--env-file", ".env.test", 
  ...composeFiles, 
  "up", "--build", 
  "--abort-on-container-exit", 
  "--exit-code-from", "test-e2e"
];

const { status } = spawnSync("docker", runArgs, { stdio: "inherit" });

console.log(`🧹 Cleaning up E2E environment...`);
spawnSync("docker", [
  "compose", 
  "--env-file", ".env.test", 
  ...composeFiles, 
  "down", "-v"
], { stdio: "inherit" });

process.exit(status ?? 1);