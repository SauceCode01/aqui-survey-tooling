import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  setupMeshNetwork,
  teardownAll,
  getBootOrder,
  bootService,
  mesh,
} from "./mesh-utils.js";

const handleShutdown = () => {
  teardownAll();
  process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

try {
  const bootOrder = getBootOrder();

  // ------------------------------------------------------------------
  // STAGE 1: ISOLATED SUBMODULE TESTING (Unit & Local E2E)
  // ------------------------------------------------------------------
  console.log(`\n========================================`);
  console.log(`🧪 STAGE 1: LOCAL SUBMODULE TEST SUITES`);
  console.log(`========================================`);

  for (const serviceName of bootOrder) {
    const config = mesh.services[serviceName];
    console.log(
      `\n-> Running 'make test' for [${serviceName}] in isolation...`,
    );

    const { status } = spawnSync("make", ["test"], {
      cwd: config.path,
      stdio: "inherit",
    });
    if (status !== 0) {
      console.error(`🚨 Local test tests failed for ${serviceName}`);
      process.exit(1);
    }
  }

  // ------------------------------------------------------------------
  // STAGE 2: INTEGRATED PRODUCTION MESH BOOTUP
  // ------------------------------------------------------------------
  console.log(`\n========================================`);
  console.log(`🏭 STAGE 2: INTEGRATED PRODUCTION MESH`);
  console.log(`========================================`);

  setupMeshNetwork();

  for (const serviceName of bootOrder) {
    bootService(serviceName, "prod");
  }

  // ------------------------------------------------------------------
  // STAGE 3: GLOBAL E2E PLAYWRIGHT SUITE
  // ------------------------------------------------------------------
  console.log(`\n========================================`);
  console.log(`🚦 STAGE 3: GLOBAL E2E ASSERTIONS`);
  console.log(`========================================`);

  const overridesDir = join(process.cwd(), ".mesh", "overrides");
  if (!existsSync(overridesDir)) {
    mkdirSync(overridesDir, { recursive: true });
  }

  // Write the override file inside the central .mesh/overrides folder
  const e2eOverridePath = join(overridesDir, "e2e.yml");
  writeFileSync(
    e2eOverridePath,
    `
networks:
  default:
    name: global_mesh
    external: true
  `,
  );

  const { status: e2eStatus } = spawnSync(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.yml", // Just the filename, since cwd is already 'e2e'
      "-f",
      join("..", ".mesh", "overrides", "e2e.yml"), // Step out of e2e/ to point to the central override
      "up",
      "--build",
      "--abort-on-container-exit",
      "--exit-code-from",
      "global-e2e",
    ],
    {
      cwd: join(process.cwd(), "e2e"),
      stdio: "inherit",
    },
  );

  process.exitCode = e2eStatus ?? 1;
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  teardownAll();
}
