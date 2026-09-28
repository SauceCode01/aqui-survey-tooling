import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  setupMeshNetwork,
  teardownAll,
  getBootOrder,
  bootService,
  currentRunCtx,
  manifests,
  meshConfig,
} from "./mesh-utils.js";
import { runAsync } from "./mesh-engine.js";

let shuttingDown = false;

const handleSignal = async (signal: "SIGINT" | "SIGTERM") => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n🛑 Received ${signal} during test execution. Tearing down...`);
  try {
    await teardownAll(currentRunCtx);
  } finally {
    process.exit(signal === "SIGINT" ? 130 : 143);
  }
};

process.on("SIGINT", () => handleSignal("SIGINT"));
process.on("SIGTERM", () => handleSignal("SIGTERM"));

async function main() {
  const startTime = Date.now();
  const summary: { stage: string; status: "PASSED" | "FAILED"; details?: string }[] = [];

  try {
    const bootOrder = getBootOrder();

    // ------------------------------------------------------------------
    // STAGE 1: ISOLATED SUBMODULE TESTING (Unit & Local Checks)
    // ------------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`🧪 STAGE 1: LOCAL SUBMODULE TEST SUITES`);
    console.log(`========================================`);

    for (const serviceName of bootOrder) {
      const manifest = manifests[serviceName];
      const servicePath = meshConfig.services[serviceName].path;
      console.log(`\n-> Running isolated tests for [${serviceName}] (Owner: ${manifest.owner.team})...`);

      const testCmd = manifest.commands?.test || "make test";
      const result = await runAsync("sh", ["-c", testCmd], {
        cwd: servicePath,
        inheritStdio: true,
      });

      if (result.status !== 0) {
        summary.push({
          stage: `Stage 1: ${serviceName}`,
          status: "FAILED",
          details: `Local tests failed. Owner: ${manifest.owner.team} (${manifest.owner.channel || "no channel"})`,
        });
        throw new Error(`🚨 Local tests failed for [${serviceName}]. Owner: ${manifest.owner.team}`);
      } else {
        summary.push({ stage: `Stage 1: ${serviceName}`, status: "PASSED" });
      }
    }

    // ------------------------------------------------------------------
    // STAGE 2: INTEGRATED PRODUCTION MESH BOOTUP
    // ------------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`🏭 STAGE 2: INTEGRATED PRODUCTION MESH`);
    console.log(`========================================`);

    await setupMeshNetwork(currentRunCtx);

    for (const serviceName of bootOrder) {
      await bootService(serviceName, "prod", currentRunCtx);
    }
    summary.push({ stage: "Stage 2: Integrated Mesh Bootup", status: "PASSED" });

    // ------------------------------------------------------------------
    // STAGE 3: GLOBAL E2E PLAYWRIGHT / API SUITE
    // ------------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`🚦 STAGE 3: GLOBAL E2E ASSERTIONS`);
    console.log(`========================================`);

    const e2eDir = join(process.cwd(), "e2e");
    const e2eOverridePath = join(currentRunCtx.overridesDir, "e2e.yml");

    const e2eOverrideContent = `
services:
  global-e2e:
    labels:
      - com.mesh.run=${currentRunCtx.runId}
      - com.mesh.service=global-e2e
    networks:
      default: {}
networks:
  default:
    name: ${currentRunCtx.networkName}
    external: true
`;
    writeFileSync(e2eOverridePath, e2eOverrideContent.trim() + "\n");

    const e2eResult = await runAsync(
      "docker",
      [
        "compose",
        "--project-directory",
        e2eDir,
        "-p",
        `mesh_e2e_${currentRunCtx.runId}`,
        "-f",
        "docker-compose.yml",
        "-f",
        e2eOverridePath,
        "up",
        "--build",
        "--abort-on-container-exit",
        "--exit-code-from",
        "global-e2e",
      ],
      {
        cwd: e2eDir,
        inheritStdio: true,
      }
    );

    if (e2eResult.status !== 0) {
      summary.push({
        stage: "Stage 3: Global E2E",
        status: "FAILED",
        details: `E2E suite exited with code ${e2eResult.status}`,
      });
      process.exitCode = e2eResult.status ?? 1;
    } else {
      summary.push({ stage: "Stage 3: Global E2E", status: "PASSED" });
      process.exitCode = 0;
    }
  } catch (err: any) {
    console.error(`\n🚨 Test Pipeline Error: ${err.message || err}`);
    process.exitCode = 1;
  } finally {
    // Stage 3 cleanup: explicitly down the e2e stack before tearing down network
    const e2eDir = join(process.cwd(), "e2e");
    const e2eOverridePath = join(currentRunCtx.overridesDir, "e2e.yml");
    if (existsSync(e2eOverridePath)) {
      console.log("   -> Stopping global-e2e deployment...");
      await runAsync(
        "docker",
        [
          "compose",
          "--project-directory",
          e2eDir,
          "-p",
          `mesh_e2e_${currentRunCtx.runId}`,
          "-f",
          "docker-compose.yml",
          "-f",
          e2eOverridePath,
          "down",
          "-v",
          "--remove-orphans",
        ],
        { cwd: e2eDir, collectOutput: false }
      );
    }

    await teardownAll(currentRunCtx);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n========================================`);
    console.log(`📊 TEST EXECUTION SUMMARY (${duration}s)`);
    console.log(`========================================`);
    for (const item of summary) {
      const icon = item.status === "PASSED" ? "✅" : "❌";
      console.log(`${icon} ${item.stage.padEnd(35)} : ${item.status}${item.details ? ` (${item.details})` : ""}`);
    }
    console.log(`========================================\n`);
  }
}

main();
