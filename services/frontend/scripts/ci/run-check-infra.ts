import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getMocks, getOverride } from "./utils.js";

interface RunContext {
  stepName: string;
  targetFile?: string;
  envName?: string;
  filesUsed?: string[];
}

// Scans .docker/{core,mocks,overrides} for every file that defines a given
// top-level service block, and notes whether that block actually carries
// an image/build directive.
function findServiceDefiners(serviceName: string): string[] {
  const dirsToScan = [".docker/core", ".docker/mocks", ".docker/overrides"];
  const hits: string[] = [];

  for (const dir of dirsToScan) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".yml") && !file.endsWith(".yaml")) continue;
      const filePath = join(dir, file);
      const content = readFileSync(filePath, "utf-8");
      const hasBlock = new RegExp(`^\\s{2}${serviceName}:\\s*$`, "m").test(content);
      if (!hasBlock) continue;
      const hasImageOrBuild = new RegExp(
        `^\\s{2}${serviceName}:[\\s\\S]*?^\\s{4,}(image|build):`,
        "m",
      ).test(content);
      hits.push(`    - ${filePath}${hasImageOrBuild ? "  (defines image/build)" : "  (no image/build here)"}`);
    }
  }
  return hits;
}

function explainComposeMergeFailure(ctx: RunContext, rawOutput: string): string {
  const lines: string[] = [];
  const serviceMatch = rawOutput.match(
    /service "([^"]+)" has neither an image nor a build context specified/,
  );
  const envMissingMatch = /env file .* not found|no such file or directory.*\.env/i.test(rawOutput);

  lines.push(`Environment          : ${ctx.envName}`);
  lines.push(`Compose files merged :`);
  (ctx.filesUsed ?? []).filter((f) => f !== "-f").forEach((f) => lines.push(`    - ${f}`));
  lines.push("");

  if (serviceMatch) {
    const serviceName = serviceMatch[1];
    lines.push(
      `ROOT CAUSE: Service "${serviceName}" is referenced in the merged stack above, but none of those`,
    );
    lines.push(`files provide an "image:" or "build:" for it — Docker Compose cannot start it as-is.`);
    lines.push("");
    lines.push(`Every file under .docker/ that defines a "${serviceName}:" service block:`);
    const definers = findServiceDefiners(serviceName);
    if (definers.length > 0) {
      definers.forEach((d) => lines.push(d));
    } else {
      lines.push(`    (none found — check spelling/indentation of "${serviceName}:" in your yml files)`);
    }
    lines.push("");
    lines.push("HOW TO FIX:");
    lines.push(
      `  1. If "${serviceName}" belongs in the "${ctx.envName}" environment: one of the files above defines`,
    );
    lines.push(
      `     its image/build. Add that file to the "${ctx.envName}" entry in the "environments" array in`,
    );
    lines.push(`     scripts/ci/run-check-infra.ts, and to the matching scripts/ci/run-*.ts launcher.`);
    lines.push(
      `  2. If "${serviceName}" should NOT be in "${ctx.envName}" at all: one of the merged override files`,
    );
    lines.push(
      `     listed above is misnamed. getOverride(stage) in scripts/ci/utils.ts matches overrides purely`,
    );
    lines.push(
      `     by filename (docker-compose.<stage>.override.yml) — a file named for stage "${(ctx.envName ?? "").toLowerCase()}" whose`,
    );
    lines.push(
      `     CONTENT actually configures "${serviceName}" (belonging to a different stage) gets wrongly pulled`,
    );
    lines.push(`     into this stack. Rename it to the stage it actually configures, e.g.:`);
    lines.push(
      `       mv .docker/overrides/docker-compose.${(ctx.envName ?? "").toLowerCase()}.override.yml \\`,
    );
    lines.push(`          .docker/overrides/docker-compose.<correct-stage>.override.yml`);
  } else if (envMissingMatch) {
    lines.push(`ROOT CAUSE: A referenced .env file could not be found.`);
    lines.push("");
    lines.push("HOW TO FIX:");
    lines.push(`  - Create the missing env file at the project root (e.g. .env.dev, .env.prod, .env.test), or`);
    lines.push(`  - Update the "env_file:" entry in the relevant .docker/core/docker-compose.*.yml to point`);
    lines.push(`    to a file that actually exists.`);
  } else {
    lines.push("Docker Compose failed to resolve this merged stack. Common causes:");
    lines.push(`  - A "\${VAR}" substitution with no default and no value set in the shell or an env_file.`);
    lines.push(`  - A YAML syntax error in one of the files listed above.`);
    lines.push(`  - A duplicate or conflicting key across two merged files.`);
  }

  lines.push("");
  lines.push("Raw Docker Compose / Conftest output:");
  lines.push("-".repeat(60));
  lines.push(rawOutput.trim());
  lines.push("-".repeat(60));

  return lines.join("\n");
}

function runCommand(command: string, ctx: RunContext) {
  const result = spawnSync(command, {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf-8",
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  if (result.status !== 0) {
    console.error("\n" + "=".repeat(60));
    console.error(`🚨 INFRASTRUCTURE CHECK FAILED 🚨`);
    console.error("=".repeat(60));
    console.error(`Failed Step : ${ctx.stepName}`);
    if (ctx.targetFile) {
      console.error(`Target File : ${ctx.targetFile}  <-- FIX THIS FILE`);
    }
    console.error("=".repeat(60));

    if (ctx.envName) {
      console.error("\n" + explainComposeMergeFailure(ctx, stdout + stderr));
    }

    console.error("");
    process.exit(1);
  }
}

function getYamlFiles(dirPath: string): string[] {
  const pwd = process.cwd();
  const fullPath = join(pwd, dirPath);
  if (!existsSync(fullPath)) return [];

  return readdirSync(fullPath)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => join(dirPath, file));
}

function main() {
  const pwd = process.cwd();

  console.log("\n🔍 1. Linting Dockerfile...");
  runCommand(
    "docker run --rm -i hadolint/hadolint hadolint --failure-threshold error - < Dockerfile",
    { stepName: "Dockerfile Linting", targetFile: "Dockerfile" },
  );

  console.log("\n🔍 2. Validating Dockerfile Contract...");
  runCommand(
    `docker run --rm -v "${pwd}:/project" -w /project openpolicyagent/conftest test Dockerfile -p policy/dockerfile/`,
    { stepName: "Dockerfile Contract", targetFile: "Dockerfile" },
  );

  const coreFiles = getYamlFiles(".docker/core").filter((f) => !f.includes("standalone.yml"));
  const mockFiles = getYamlFiles(".docker/mocks");
  const overrideFiles = getYamlFiles(".docker/overrides");
  const partialFilesList = [...coreFiles, ...mockFiles, ...overrideFiles];

  if (partialFilesList.length > 0) {
    console.log(`\n🔍 3. Validating All Partial Files (${partialFilesList.length} files batched)...`);
    runCommand(
      `docker run --rm -v "${pwd}:/project" -w /project openpolicyagent/conftest test ${partialFilesList.join(" ")} -p policy/compose/ --all-namespaces`,
      { stepName: "Partial File Validation", targetFile: "One or more compose files in .docker/" },
    );
  }

  console.log("\n🔍 4. Validating Merged Architecture states...");

  const environments = [
    {
      name: "Dev",
      files: [
        "-f", ".docker/core/docker-compose.base.yml",
        "-f", ".docker/core/docker-compose.dev.yml",
        ...getOverride("dev"),
        "-f", ".docker/core/docker-compose.standalone.yml",
      ],
    },
    {
      name: "Prod",
      files: [
        "-f", ".docker/core/docker-compose.base.yml",
        "-f", ".docker/core/docker-compose.prod.yml",
        ...getMocks(),
        ...getOverride("prod"),
        "-f", ".docker/core/docker-compose.standalone.yml",
      ],
    },
    {
      name: "E2E",
      files: [
        "-f", ".docker/core/docker-compose.base.yml",
        "-f", ".docker/core/docker-compose.prod.yml",
        "-f", ".docker/core/docker-compose.e2e.yml",
        ...getMocks(),
        ...getOverride("prod"),
        ...getOverride("e2e"),
      ],
    },
    {
      name: "Test",
      files: [
        "-f", ".docker/core/docker-compose.base.yml",
        "-f", ".docker/core/docker-compose.test.yml",
        ...getOverride("test"),
      ],
    },
  ];

  for (const env of environments) {
    console.log(`     -> Checking ${env.name} stack...`);
    const composeArgs = env.files.join(" ");

    runCommand(
      `bash -c 'set -o pipefail && PUBLIC_PORT=3000 PORT=3000 docker compose ${composeArgs} config | docker run --rm -i -v "${pwd}:/project" -w /project openpolicyagent/conftest test - --parser yaml -p policy/compose/security.rego --all-namespaces'`,
      {
        stepName: `Merged Architecture Validation (${env.name})`,
        targetFile: `Combined ${env.name} Stack`,
        envName: env.name,
        filesUsed: env.files,
      },
    );
  }
  
  console.log("\n✅ All infrastructure and contract checks passed.");
}

main();