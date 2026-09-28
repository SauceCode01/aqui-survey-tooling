import { spawnSync } from "node:child_process";
import { getMocks, getOverride } from "./utils.js";

const composeFiles = [
  "-f", ".docker/core/docker-compose.base.yml",
  "-f", ".docker/core/docker-compose.prod.yml",
  ...getMocks(),
  ...getOverride("prod"),
  "-f", ".docker/core/docker-compose.standalone.yml",
];

console.log(`🚀 Starting Production Environment (with Dynamic Mocks)...`);
const { status } = spawnSync("docker", [
  "compose", 
  "--env-file", ".env.prod", 
  ...composeFiles, 
  "up", "--build"
], { stdio: "inherit" });

process.exit(status ?? 1);