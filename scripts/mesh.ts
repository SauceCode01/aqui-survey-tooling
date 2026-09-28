#!/usr/bin/env node

import {
  runDoctor,
  runBootstrap,
  runConformanceChecks,
  createRunContext,
  setupMeshNetwork,
  teardownAll,
  loadMeshMembership,
  loadAllManifests,
  getBootOrder,
  bootService,
  tailLogs,
} from "./ci/mesh-engine.js";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "doctor": {
      const ok = await runDoctor();
      process.exit(ok ? 0 : 1);
      break;
    }

    case "bootstrap": {
      await runBootstrap();
      process.exit(0);
      break;
    }

    case "check":
    case "check-infra":
    case "conformance": {
      const result = await runConformanceChecks();
      process.exit(result.success ? 0 : 1);
      break;
    }

    case "dev": {
      // Delegate to run-mesh-dev.ts
      await import("./ci/run-mesh-dev.js");
      break;
    }

    case "prod": {
      // Delegate to run-mesh-prod.ts
      await import("./ci/run-mesh-prod.js");
      break;
    }

    case "test": {
      // Delegate to run-mesh-test.ts
      await import("./ci/run-mesh-test.js");
      break;
    }

    case "lock": {
      console.log("🔒 Generating mesh.lock.json...");
      const manifests = loadAllManifests();
      const lockData = {
        version: 1,
        generatedAt: new Date().toISOString(),
        services: Object.fromEntries(
          Object.entries(manifests).map(([name, m]) => [
            name,
            {
              contract: m.contract,
              version: m.provides.version,
              owner: m.owner.team,
              verified: true,
            },
          ])
        ),
      };
      writeFileSync(join(process.cwd(), "mesh.lock.json"), JSON.stringify(lockData, null, 2) + "\n");
      console.log("✅ mesh.lock.json updated.");
      process.exit(0);
      break;
    }

    case "help":
    default: {
      console.log(`
Mesh Orchestrator CLI

Usage:
  pnpm exec tsx scripts/mesh.ts <command>

Commands:
  doctor        Verify prerequisites (Docker, Compose >=2.24, Node >=20, submodules, waivers)
  bootstrap     Initialize git submodules, git config settings, and copy example env files
  check         Run conformance suite, Dockerfile policy, and merged stack validation
  dev           Start development mesh with live logs
  prod          Start production mesh with health waiting and live logs
  test          Run full test pipeline (Stage 1 isolated -> Stage 2 mesh -> Stage 3 global e2e)
  lock          Update mesh.lock.json with verified service metadata
  help          Show this message
`);
      process.exit(0);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
