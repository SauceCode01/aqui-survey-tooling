import { spawnSync } from "node:child_process";
import { getOverride } from "./utils.js";

const composeFiles = [
  "-f", ".docker/core/docker-compose.base.yml",
  "-f", ".docker/core/docker-compose.dev.yml",
  ...getOverride("dev"),
  "-f", ".docker/core/docker-compose.standalone.yml",
];

console.log(`🚀 Starting Development Environment (Isolated)...`);
const { status } = spawnSync("docker", [
  "compose", 
  "--project-directory", ".",
  "--env-file", ".env.dev", // Tells CLI to parse YAML using these variables
  ...composeFiles, 
  "up", "--build"
], { stdio: "inherit" });

process.exit(status ?? 1);