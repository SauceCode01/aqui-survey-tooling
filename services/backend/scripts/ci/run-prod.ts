import { spawn, spawnSync } from "node:child_process";
import { getMocks, getOverride } from "./utils.js";

const composeFiles = [
  "-f", ".docker/core/docker-compose.base.yml",
  "-f", ".docker/core/docker-compose.prod.yml",
  ...getMocks(),
  ...getOverride("prod"),
  "-f", ".docker/core/docker-compose.standalone.yml",
];

const envFile = ".env.prod";
let isCleaningUp = false;

const cleanup = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n🧹 Tearing down containers and networks...`);
  spawnSync(
    "docker",
    [
      "compose",
      "--project-directory", ".",
      "--env-file", envFile,
      ...composeFiles,
      "down",
      "-v",
      "--remove-orphans",
    ],
    { stdio: "inherit" }
  );
  console.log(`🏁 All containers and networks cleanly stopped. Exiting.\n`);
};

process.on("SIGINT", () => {
  if (isCleaningUp) {
    console.log(`\n⏳ Teardown is currently in progress, waiting for Docker to finish...`);
    return;
  }
  cleanup();
  process.exit(130);
});

process.on("SIGTERM", () => {
  if (isCleaningUp) {
    console.log(`\n⏳ Teardown is currently in progress, waiting for Docker to finish...`);
    return;
  }
  cleanup();
  process.exit(143);
});

console.log(`🚀 Starting Production Environment (with Dynamic Mocks)...`);
console.log(`(Press Ctrl+C to safely stop and tear down all containers)\n`);

const child = spawn(
  "docker",
  [
    "compose",
    "--project-directory", ".",
    "--env-file", envFile,
    ...composeFiles,
    "up",
    "--build",
    "--remove-orphans",
    "--force-recreate",
  ],
  { stdio: "inherit" }
);

child.on("close", (code) => {
  cleanup();
  process.exit(code ?? 0);
});