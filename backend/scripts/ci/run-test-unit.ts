import { spawnSync } from "node:child_process";
import { getOverride } from "./utils.js";

const composeFiles = [
  "-f", ".docker/core/docker-compose.base.yml",
  "-f", ".docker/core/docker-compose.test.yml",
  ...getOverride("test"),
];

console.log(`🧪 Running Unit Tests (Isolated)...`);
const runArgs = [
  "compose", 
  "--env-file", ".env.test", 
  ...composeFiles, 
  "run", "--build", "--rm", "app"
];
const { status } = spawnSync("docker", runArgs, { stdio: "inherit" });

console.log(`🧹 Cleaning up Unit Test environment...`);
spawnSync("docker", [
  "compose", 
  "--env-file", ".env.test", 
  ...composeFiles, 
  "down", "-v"
], { stdio: "inherit" });

process.exit(status ?? 1);