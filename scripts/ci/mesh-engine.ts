import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import * as readline from "node:readline";

// ==============================================================================
// CONTRACT & TYPES
// ==============================================================================

export interface ServiceOwner {
  team: string;
  channel?: string;
  codeowners?: string;
}

export interface ServiceRuntime {
  portEnv?: string;
  defaultPort: number;
  health: {
    path: string;
    startPeriod?: string;
  };
}

export interface ServiceProvides {
  api: string;
  version: string;
  openapi?: string;
}

export interface ServiceDependency {
  api: string;
  range: string;
  urlEnv: string;
  mock?: {
    service: string;
    profile?: string;
  };
}

export interface ServiceManifest {
  contract: number;
  name: string;
  owner: ServiceOwner;
  runtime: ServiceRuntime;
  provides: ServiceProvides;
  dependencies: Record<string, ServiceDependency>;
  privateServices?: string[];
  env?: {
    required?: string[];
    buildArgs?: string[];
  };
  compose?: {
    base?: string;
    dev?: string;
    prod?: string;
    test?: string;
    standalone?: string;
  };
  commands?: {
    check?: string;
    test?: string;
    extensionCheck?: string;
  };
}

export interface MeshMembershipConfig {
  contract: number;
  services: Record<
    string,
    {
      path: string;
      port?: number;
      replaceMocks?: Record<string, string>;
      envOverrides?: Record<string, string>;
    }
  >;
}

export interface DeploymentRecord {
  serviceName: string;
  path: string;
  composeFiles: string[];
  envFile: string;
  projectName: string;
}

export interface RunContext {
  runId: string;
  networkName: string;
  overridesDir: string;
  logsDir: string;
}

// ==============================================================================
// RUN CONTEXT GENERATION (Scoped Run ID & Label Isolation)
// ==============================================================================

export function createRunContext(customRunId?: string): RunContext {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const runId = customRunId || `run_${timestamp}_${randomSuffix}`;
  const networkName = `mesh_${runId}`;
  const overridesDir = join(process.cwd(), ".mesh", "overrides", runId);
  const logsDir = join(process.cwd(), ".mesh", "logs", runId);

  if (!existsSync(overridesDir)) {
    mkdirSync(overridesDir, { recursive: true });
  }
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  return { runId, networkName, overridesDir, logsDir };
}

// ==============================================================================
// ASYNC PROCESS EXECUTION & SIGNAL FORWARDING (B8)
// ==============================================================================

export interface ExecResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

export function runAsync(
  cmd: string,
  args: string[],
  options: SpawnOptions & { inheritStdio?: boolean; collectOutput?: boolean } = {}
): Promise<ExecResult> {
  return new Promise((resolvePromise, rejectPromise) => {
    const stdioMode = options.inheritStdio ? "inherit" : "pipe";
    const child: ChildProcess = spawn(cmd, args, {
      ...options,
      stdio: options.collectOutput ? ["inherit", "pipe", "pipe"] : stdioMode,
    });

    let stdoutBuffer = "";
    let stderrBuffer = "";

    if (child.stdout && options.collectOutput) {
      child.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        stdoutBuffer += text;
        if (options.inheritStdio) process.stdout.write(text);
      });
    }
    if (child.stderr && options.collectOutput) {
      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        stderrBuffer += text;
        if (options.inheritStdio) process.stderr.write(text);
      });
    }

    const forwardSignal = (sig: NodeJS.Signals) => {
      try {
        child.kill(sig);
      } catch {}
    };

    const sigintHandler = () => forwardSignal("SIGINT");
    const sigtermHandler = () => forwardSignal("SIGTERM");

    process.on("SIGINT", sigintHandler);
    process.on("SIGTERM", sigtermHandler);

    child.on("error", (err) => {
      process.off("SIGINT", sigintHandler);
      process.off("SIGTERM", sigtermHandler);
      rejectPromise(err);
    });

    child.on("close", (status, signal) => {
      process.off("SIGINT", sigintHandler);
      process.off("SIGTERM", sigtermHandler);
      resolvePromise({
        status,
        signal,
        stdout: stdoutBuffer,
        stderr: stderrBuffer,
      });
    });
  });
}

// ==============================================================================
// MANIFEST & TOPOLOGY ENGINE (C2, X3, B14)
// ==============================================================================

export function loadMeshMembership(rootPath: string = process.cwd()): MeshMembershipConfig {
  const meshJsonPath = join(rootPath, "mesh.json");
  if (!existsSync(meshJsonPath)) {
    throw new Error(`🚨 mesh.json not found at ${meshJsonPath}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(readFileSync(meshJsonPath, "utf-8"));
  } catch (err: any) {
    throw new Error(`🚨 Failed to parse mesh.json: ${err.message}`);
  }

  if (!parsed.services || typeof parsed.services !== "object") {
    throw new Error("🚨 mesh.json must contain a 'services' object mapping service names to configs.");
  }

  return parsed as MeshMembershipConfig;
}

export function loadServiceManifest(
  serviceName: string,
  serviceRelativePath: string,
  rootPath: string = process.cwd(),
  legacyConfig?: { port?: number; replaceMocks?: Record<string, string>; envOverrides?: Record<string, string> }
): ServiceManifest {
  const serviceDir = resolve(rootPath, serviceRelativePath);
  const manifestPath = join(serviceDir, "mesh.service.json");

  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ServiceManifest;
      if (manifest.contract > 1) {
        console.warn(
          `⚠️ Service [${serviceName}] declares contract version ${manifest.contract}, higher than supported (1).`
        );
      }
      return manifest;
    } catch (err: any) {
      throw new Error(`🚨 Failed to parse manifest for [${serviceName}] at ${manifestPath}: ${err.message}`);
    }
  }

  // Phase 1 Legacy Adapter: synthesize manifest from conventions + mesh.json
  console.log(`ℹ️ [${serviceName}] has no mesh.service.json. Synthesizing legacy adapter...`);
  const port = legacyConfig?.port ?? 3000;
  const dependencies: Record<string, ServiceDependency> = {};

  if (legacyConfig?.replaceMocks) {
    for (const [depKey, depTarget] of Object.entries(legacyConfig.replaceMocks)) {
      const urlEnv = Object.keys(legacyConfig.envOverrides || {}).find((k) =>
        k.toUpperCase().includes(depKey.toUpperCase())
      ) || `${depKey.toUpperCase()}_URL`;

      dependencies[depTarget] = {
        api: `${depTarget}-api`,
        range: "^1.0.0",
        urlEnv,
        mock: { service: `mock-${depKey}` },
      };
    }
  }

  return {
    contract: 1,
    name: serviceName,
    owner: { team: "unassigned", channel: "#general" },
    runtime: {
      portEnv: "PORT",
      defaultPort: port,
      health: { path: "/health", startPeriod: "15s" },
    },
    provides: {
      api: `${serviceName}-api`,
      version: "1.0.0",
    },
    dependencies,
    privateServices: [],
    commands: {
      check: "make check-infra",
      test: "make test",
    },
  };
}

export function loadAllManifests(rootPath: string = process.cwd()): Record<string, ServiceManifest> {
  const meshConfig = loadMeshMembership(rootPath);
  const manifests: Record<string, ServiceManifest> = {};

  for (const [name, cfg] of Object.entries(meshConfig.services)) {
    manifests[name] = loadServiceManifest(name, cfg.path, rootPath, cfg);
  }

  return manifests;
}

export function getBootOrder(manifests: Record<string, ServiceManifest>): string[] {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const serviceNames = Object.keys(manifests);

  for (const name of serviceNames) {
    inDegree[name] = 0;
    adjList[name] = [];
  }

  for (const name of serviceNames) {
    const manifest = manifests[name];
    const depNames = Object.keys(manifest.dependencies || {});
    for (const dep of depNames) {
      if (!manifests[dep]) {
        throw new Error(
          `🚨 Service [${name}] depends on unknown service [${dep}]. Available services: ${serviceNames.join(", ")}`
        );
      }
      adjList[dep].push(name);
      inDegree[name]++;
    }
  }

  const queue: string[] = serviceNames.filter((name) => inDegree[name] === 0);
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const dependent of adjList[current]) {
      inDegree[dependent]--;
      if (inDegree[dependent] === 0) queue.push(dependent);
    }
  }

  if (order.length !== serviceNames.length) {
    const remaining = serviceNames.filter((s) => !order.includes(s));
    throw new Error(
      `🚨 Circular dependency detected in service mesh dependencies among: ${remaining.join(", ")}`
    );
  }

  return order;
}

// ==============================================================================
// OVERRIDE GENERATION (B4, B7, B10, B11, B12, X11)
// ==============================================================================

export function generateMeshOverride(
  serviceName: string,
  manifests: Record<string, ServiceManifest>,
  ctx: RunContext,
  mode: "dev" | "prod" | "test" = "prod"
): string {
  const manifest = manifests[serviceName];
  const overridePath = join(ctx.overridesDir, `${serviceName}.${mode}.yml`);

  // Derive dependency URLs: http://<depAlias>:<depPort>
  const envLines: string[] = [
    `      - INFRA_MODE=integrated`,
    `      - PORT=${manifest.runtime.defaultPort}`,
  ];

  for (const [depName, depCfg] of Object.entries(manifest.dependencies || {})) {
    const targetManifest = manifests[depName];
    if (targetManifest) {
      const targetPort = targetManifest.runtime.defaultPort;
      const targetUrl = `http://${depName}:${targetPort}`;
      envLines.push(`      - ${depCfg.urlEnv}=${targetUrl}`);
    }
  }

  // Restart policy: in test mode, must be "no" (B12)
  const restartLine = mode === "test" ? `    restart: "no"` : "";

  // Content: Keep 'default' private, attach only 'app' to 'mesh' external network with alias (B4, X11)
  const content = `
services:
  app:
    labels:
      - com.mesh.run=${ctx.runId}
      - com.mesh.service=${serviceName}
    networks:
      default: {}
      mesh:
        aliases:
          - ${serviceName}
    environment:
${envLines.join("\n")}
${restartLine ? restartLine : ""}
networks:
  mesh:
    name: ${ctx.networkName}
    external: true
`;

  writeFileSync(overridePath, content.trim() + "\n");
  return overridePath;
}

export function getLocalMocks(
  servicePath: string,
  manifest: ServiceManifest
): string[] {
  const mocksDir = join(servicePath, ".docker", "mocks");
  if (!existsSync(mocksDir)) return [];

  // Suppress mocks for dependencies that are satisfied live by the mesh
  const depsToSuppress = Object.keys(manifest.dependencies || {}).flatMap((key) => [
    `docker-compose.${key}.yml`,
    `docker-compose.mock-${key}.yml`,
    `docker-compose.${key}-mock.yml`,
  ]);

  return readdirSync(mocksDir)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .filter((file) => !depsToSuppress.includes(file))
    .flatMap((file) => ["-f", join(".docker", "mocks", file)]);
}

export function getLocalOverride(servicePath: string, stage: string): string[] {
  const overrideRelPath = join(".docker", "overrides", `docker-compose.${stage}.override.yml`);
  return existsSync(join(servicePath, overrideRelPath)) ? ["-f", overrideRelPath] : [];
}

// ==============================================================================
// NETWORK SETUP & TEARDOWN ENGINE (B1, B2, B7, B8)
// ==============================================================================

const activeDeployments = new Map<string, DeploymentRecord>();
const activeLogStreams: ChildProcess[] = [];
let isTearingDown = false;

export async function setupMeshNetwork(ctx: RunContext) {
  console.log(`🌐 Creating Global Mesh Network: ${ctx.networkName}`);
  await runAsync("docker", [
    "network",
    "create",
    "--label",
    `com.mesh.run=${ctx.runId}`,
    ctx.networkName,
  ]);
}

export async function teardownAll(ctx: RunContext) {
  if (isTearingDown) return;
  isTearingDown = true;

  console.log(`\n🧹 Tearing down mesh session [${ctx.runId}]...`);

  // 1. Terminate log streamers
  for (const stream of activeLogStreams) {
    try {
      stream.kill("SIGKILL");
    } catch {}
  }

  // 2. Down active Compose deployments
  for (const [name, dep] of activeDeployments.entries()) {
    console.log(`   -> Stopping deployment [${name}] (${dep.projectName})...`);
    await runAsync(
      "docker",
      [
        "compose",
        "--project-directory",
        dep.path,
        "-p",
        dep.projectName,
        "--env-file",
        dep.envFile,
        ...dep.composeFiles,
        "down",
        "-v",
        "--remove-orphans",
      ],
      { cwd: dep.path, collectOutput: false }
    );
  }

  // 3. Label-based container sweep (Nuclear safety for any stray container from this run)
  console.log(`   -> Sweeping remaining containers for run [${ctx.runId}]...`);
  const psResult = await runAsync(
    "docker",
    ["ps", "-a", "-q", "--filter", `label=com.mesh.run=${ctx.runId}`],
    { collectOutput: true }
  );
  const containerIds = psResult.stdout.trim().split(/\s+/).filter(Boolean);
  if (containerIds.length > 0) {
    await runAsync("docker", ["rm", "-f", ...containerIds]);
  }

  // 4. Remove network
  console.log(`   -> Removing network [${ctx.networkName}]...`);
  await runAsync("docker", ["network", "rm", ctx.networkName]);

  // 5. Clean temporary overrides directory
  if (existsSync(ctx.overridesDir)) {
    rmSync(ctx.overridesDir, { recursive: true, force: true });
  }

  activeDeployments.clear();
  isTearingDown = false;
  console.log(`✅ Teardown complete for session [${ctx.runId}].`);
}

// ==============================================================================
// SERVICE BOOT ENGINE (B2, B3, B6, B9, B10)
// ==============================================================================

export async function bootService(
  serviceName: string,
  mode: "dev" | "prod",
  manifests: Record<string, ServiceManifest>,
  meshConfig: MeshMembershipConfig,
  ctx: RunContext
) {
  const manifest = manifests[serviceName];
  const serviceConfig = meshConfig.services[serviceName];
  const serviceDir = resolve(process.cwd(), serviceConfig.path);

  console.log(`⏳ Booting [${serviceName}] [mode: ${mode}, infra: integrated, port: ${manifest.runtime.defaultPort}]...`);

  const orchestratorOverridePath = generateMeshOverride(serviceName, manifests, ctx, mode);

  const composeFiles = [
    "-f",
    ".docker/core/docker-compose.base.yml",
    "-f",
    `.docker/core/docker-compose.${mode}.yml`,
    ...getLocalMocks(serviceDir, manifest),
    ...getLocalOverride(serviceDir, mode),
    "-f",
    orchestratorOverridePath,
  ];

  const envFile = `.env.${mode}`;
  const projectName = `mesh_${serviceName}_${ctx.runId}`;

  activeDeployments.set(serviceName, {
    serviceName,
    path: serviceDir,
    composeFiles,
    envFile,
    projectName,
  });

  // Pass --wait and --wait-timeout 180 (B3) and --project-directory (B6) and unique project name (B9)
  const bootResult = await runAsync(
    "docker",
    [
      "compose",
      "--project-directory",
      serviceDir,
      "-p",
      projectName,
      "--env-file",
      envFile,
      ...composeFiles,
      "up",
      "-d",
      "--build",
      "--wait",
      "--wait-timeout",
      "180",
    ],
    {
      cwd: serviceDir,
      inheritStdio: true,
      env: {
        ...process.env,
        PORT: manifest.runtime.defaultPort.toString(),
        PUBLIC_PORT: manifest.runtime.defaultPort.toString(),
      },
    }
  );

  if (bootResult.status !== 0) {
    throw new Error(
      `🚨 Failed to boot service [${serviceName}] (exit code: ${bootResult.status}). Owner: ${manifest.owner.team} (${manifest.owner.channel || "no channel"})`
    );
  }

  console.log(`✅ Service [${serviceName}] is healthy on mesh network [${ctx.networkName}].`);
}

// ==============================================================================
// STREAM LOGGING (B15 - using readline)
// ==============================================================================

const colors = [
  "\x1b[36m", // cyan
  "\x1b[32m", // green
  "\x1b[33m", // yellow
  "\x1b[35m", // magenta
  "\x1b[34m", // blue
  "\x1b[31m", // red
];
const resetColor = "\x1b[0m";

export function tailLogs(
  manifests: Record<string, ServiceManifest>,
  meshConfig: MeshMembershipConfig,
  ctx: RunContext
) {
  const serviceNames = Object.keys(manifests);

  serviceNames.forEach((serviceName, index) => {
    const serviceConfig = meshConfig.services[serviceName];
    const serviceDir = resolve(process.cwd(), serviceConfig.path);
    const color = colors[index % colors.length];
    const projectName = `mesh_${serviceName}_${ctx.runId}`;

    const child = spawn(
      "docker",
      ["compose", "--project-directory", serviceDir, "-p", projectName, "logs", "-f"],
      { cwd: serviceDir }
    );

    activeLogStreams.push(child);

    const formatLine = (rawLine: string): string => {
      const cleanLine = rawLine.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
      );
      const prefix = `${color}[${serviceName}]${resetColor} `.padEnd(30 + color.length + resetColor.length);
      return `${prefix}${cleanLine}`;
    };

    if (child.stdout) {
      const rlStdout = readline.createInterface({ input: child.stdout });
      rlStdout.on("line", (line) => {
        if (line.trim()) console.log(formatLine(line));
      });
    }

    if (child.stderr) {
      const rlStderr = readline.createInterface({ input: child.stderr });
      rlStderr.on("line", (line) => {
        if (line.trim()) console.error(formatLine(line));
      });
    }
  });
}

// ==============================================================================
// SUBMODULE PREFLIGHT & GIT CHECKS (X4)
// ==============================================================================

export async function checkSubmodules(rootPath: string = process.cwd()): Promise<{ ok: boolean; message: string }> {
  const gitmodulesPath = join(rootPath, ".gitmodules");
  if (!existsSync(gitmodulesPath)) {
    return { ok: true, message: "No .gitmodules present; standalone repository mode." };
  }

  const statusResult = await runAsync("git", ["submodule", "status", "--recursive"], {
    cwd: rootPath,
    collectOutput: true,
  });

  const lines = statusResult.stdout.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const prefix = line[0];
    if (prefix === "-") {
      return { ok: false, message: `Submodule uninitialized: ${line.substring(1).trim()}` };
    }
    if (prefix === "+") {
      return { ok: false, message: `Submodule SHA differs from recorded pointer: ${line.substring(1).trim()}` };
    }
    if (prefix === "U") {
      return { ok: false, message: `Submodule has unresolved merge conflict: ${line.substring(1).trim()}` };
    }
  }

  return { ok: true, message: "All git submodules initialized and matched to pointers." };
}

// ==============================================================================
// WAIVER VERIFICATION (C4)
// ==============================================================================

export function verifyWaivers(rootPath: string = process.cwd()): { ok: boolean; violations: string[] } {
  const waiversPath = join(rootPath, "mesh.waivers.json");
  if (!existsSync(waiversPath)) {
    return { ok: true, violations: [] };
  }

  try {
    const data = JSON.parse(readFileSync(waiversPath, "utf-8"));
    const waivers: any[] = data.waivers || [];
    const now = new Date();
    const violations: string[] = [];

    for (const waiver of waivers) {
      if (!waiver.rule || !waiver.expiresAt) continue;
      const expiry = new Date(waiver.expiresAt);
      if (expiry < now) {
        violations.push(
          `Waiver for rule [${waiver.rule}] expired on ${waiver.expiresAt}. Approver: ${waiver.approver || "unknown"}, Reason: ${waiver.reason || "none"}`
        );
      }
    }

    return { ok: violations.length === 0, violations };
  } catch (err: any) {
    return { ok: false, violations: [`Invalid mesh.waivers.json: ${err.message}`] };
  }
}

// ==============================================================================
// INFRASTRUCTURE & CONFORMANCE CHECK (C3, C4, B5, B17)
// ==============================================================================

export async function runConformanceChecks(rootPath: string = process.cwd()): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  console.log("\n========================================");
  console.log("🔍 RUNNING PLATFORM CONFORMANCE SUITE");
  console.log("========================================");

  // 1. Verify Waivers
  const waiverCheck = verifyWaivers(rootPath);
  if (!waiverCheck.ok) {
    for (const v of waiverCheck.violations) {
      console.error(`🚨 WAIVER EXPIRED: ${v}`);
      errors.push(v);
    }
  }

  // 2. Load and validate manifests
  let manifests: Record<string, ServiceManifest>;
  let meshConfig: MeshMembershipConfig;
  try {
    meshConfig = loadMeshMembership(rootPath);
    manifests = loadAllManifests(rootPath);
    getBootOrder(manifests);
  } catch (err: any) {
    console.error(`🚨 Manifest / Topology Error: ${err.message}`);
    errors.push(err.message);
    return { success: false, errors };
  }

  // 3. Inspect each service
  for (const [serviceName, manifest] of Object.entries(manifests)) {
    const serviceRelPath = meshConfig.services[serviceName].path;
    const serviceDir = resolve(rootPath, serviceRelPath);

    console.log(`\n📦 Checking Service [${serviceName}] (Owner: ${manifest.owner.team})...`);

    // A. Dockerfile linting (hadolint)
    const dockerfilePath = join(serviceDir, "Dockerfile");
    if (existsSync(dockerfilePath)) {
      console.log(`   -> Linting Dockerfile via hadolint...`);
      const hadolintResult = await runAsync(
        "docker",
        [
          "run",
          "--rm",
          "-v",
          `${serviceDir}:/workspace:ro`,
          "-w",
          "/workspace",
          "hadolint/hadolint",
          "hadolint",
          "--failure-threshold",
          "error",
          "Dockerfile",
        ],
        { collectOutput: true }
      );

      if (hadolintResult.status !== 0) {
        const msg = `Dockerfile linting failed for [${serviceName}]:\n${hadolintResult.stdout}\n${hadolintResult.stderr}`;
        console.error(`   ❌ ${msg}`);
        errors.push(msg);
      } else {
        console.log(`   ✅ Dockerfile lint passed.`);
      }

      // B. Dockerfile contract verification (conftest)
      console.log(`   -> Validating Dockerfile contract via Conftest...`);
      const rootPolicyDockerfileDir = join(rootPath, "policy", "dockerfile");
      const policyDir = existsSync(rootPolicyDockerfileDir)
        ? rootPolicyDockerfileDir
        : join(serviceDir, "policy", "dockerfile");

      const conftestDf = await runAsync(
        "docker",
        [
          "run",
          "--rm",
          "-v",
          `${serviceDir}:/project`,
          "-v",
          `${policyDir}:/policy:ro`,
          "-w",
          "/project",
          "openpolicyagent/conftest:v0.56.0",
          "test",
          "Dockerfile",
          "-p",
          "/policy",
        ],
        { collectOutput: true }
      );

      if (conftestDf.status !== 0) {
        const msg = `Dockerfile policy check failed for [${serviceName}]:\n${conftestDf.stdout}\n${conftestDf.stderr}`;
        console.error(`   ❌ ${msg}`);
        errors.push(msg);
      } else {
        console.log(`   ✅ Dockerfile contract passed.`);
      }
    }

    // C. Service Extension Check (e.g. audit-deps.mjs)
    if (manifest.commands?.extensionCheck) {
      console.log(`   -> Running service extension check: ${manifest.commands.extensionCheck}...`);
      const extResult = await runAsync("sh", ["-c", manifest.commands.extensionCheck], {
        cwd: serviceDir,
        collectOutput: true,
      });
      if (extResult.status !== 0) {
        const msg = `Extension check failed for [${serviceName}]:\n${extResult.stdout}\n${extResult.stderr}`;
        console.error(`   ❌ ${msg}`);
        errors.push(msg);
      } else {
        console.log(`   ✅ Extension check passed.`);
      }
    }
  }

  // 4. Validate Merged Stack against Root Mesh Policy (C4)
  console.log("\n🛡️ Validating Merged Mesh Stack Architectures against Platform Policy...");
  const tempCtx = createRunContext("conformance_check");
  const meshPolicyDir = join(rootPath, "policy", "mesh");

  for (const [serviceName, manifest] of Object.entries(manifests)) {
    const serviceRelPath = meshConfig.services[serviceName].path;
    const serviceDir = resolve(rootPath, serviceRelPath);
    const overridePath = generateMeshOverride(serviceName, manifests, tempCtx, "prod");

    const composeArgs = [
      "--project-directory",
      serviceDir,
      "-f",
      ".docker/core/docker-compose.base.yml",
      "-f",
      ".docker/core/docker-compose.prod.yml",
      ...getLocalMocks(serviceDir, manifest),
      ...getLocalOverride(serviceDir, "prod"),
      "-f",
      overridePath,
      "config",
    ];

    const configResult = await runAsync("docker", ["compose", ...composeArgs], {
      cwd: serviceDir,
      collectOutput: true,
      env: {
        ...process.env,
        PORT: manifest.runtime.defaultPort.toString(),
        PUBLIC_PORT: manifest.runtime.defaultPort.toString(),
      },
    });

    if (configResult.status !== 0) {
      const msg = `Docker Compose failed to resolve merged stack for [${serviceName}]:\n${configResult.stderr}`;
      console.error(`   ❌ ${msg}`);
      errors.push(msg);
      continue;
    }

    // Run conftest against policy/mesh/mesh.rego
    if (existsSync(meshPolicyDir)) {
      const dataJsonPath = join(tempCtx.overridesDir, `data_${serviceName}.json`);
      writeFileSync(
        dataJsonPath,
        JSON.stringify({
          service_root: serviceDir,
          service: { name: serviceName },
          mesh_network: tempCtx.networkName,
        })
      );

      const policyChild = spawn("docker", [
        "run",
        "--rm",
        "-i",
        "-v",
        `${meshPolicyDir}:/policy:ro`,
        "-v",
        `${dataJsonPath}:/data.json:ro`,
        "openpolicyagent/conftest:v0.56.0",
        "test",
        "-",
        "--parser",
        "yaml",
        "-p",
        "/policy",
        "-d",
        "/data.json",
        "--namespace",
        "mesh",
      ]);

      let policyOutput = "";
      policyChild.stdout?.on("data", (d) => (policyOutput += d.toString()));
      policyChild.stderr?.on("data", (d) => (policyOutput += d.toString()));
      policyChild.stdin?.write(configResult.stdout);
      policyChild.stdin?.end();

      const policyStatus: number = await new Promise((res) => policyChild.on("close", res));

      if (policyStatus !== 0) {
        const msg = `Root mesh policy violation for [${serviceName}]:\n${policyOutput}`;
        console.error(`   ❌ ${msg}`);
        errors.push(msg);
      } else {
        console.log(`   ✅ Merged stack policy passed for [${serviceName}].`);
      }
    }
  }

  // Clean temp context
  if (existsSync(tempCtx.overridesDir)) {
    rmSync(tempCtx.overridesDir, { recursive: true, force: true });
  }

  if (errors.length === 0) {
    console.log("\n✅ All Platform Conformance & Policy Checks Passed.\n");
    return { success: true, errors: [] };
  } else {
    console.error(`\n🚨 Conformance checks failed with ${errors.length} error(s).\n`);
    return { success: false, errors };
  }
}

// ==============================================================================
// DOCTOR COMMAND (X15, X19)
// ==============================================================================

export async function runDoctor(): Promise<boolean> {
  console.log("🩺 Checking system environment...\n");
  let ok = true;

  // 1. Docker
  const dockerResult = await runAsync("docker", ["--version"], { collectOutput: true });
  if (dockerResult.status === 0) {
    console.log(`✅ Docker: ${dockerResult.stdout.trim()}`);
  } else {
    console.error(`❌ Docker not found or daemon not reachable.`);
    ok = false;
  }

  // 2. Docker Compose >= 2.24
  const composeResult = await runAsync("docker", ["compose", "version"], { collectOutput: true });
  if (composeResult.status === 0) {
    console.log(`✅ Docker Compose: ${composeResult.stdout.trim()}`);
  } else {
    console.error(`❌ Docker Compose not found.`);
    ok = false;
  }

  // 3. Node.js
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.replace("v", "").split(".")[0], 10);
  if (major >= 20) {
    console.log(`✅ Node.js: ${nodeVersion} (>= 20.0.0)`);
  } else {
    console.error(`❌ Node.js version ${nodeVersion} is too old. Must be >= 20.`);
    ok = false;
  }

  // 4. Submodules
  const subCheck = await checkSubmodules();
  if (subCheck.ok) {
    console.log(`✅ Git Submodules: ${subCheck.message}`);
  } else {
    console.error(`❌ Git Submodules: ${subCheck.message}`);
    ok = false;
  }

  // 5. Waivers
  const waiverCheck = verifyWaivers();
  if (waiverCheck.ok) {
    console.log(`✅ Waivers: No expired waivers.`);
  } else {
    console.error(`❌ Waivers: Found expired waivers:\n  ${waiverCheck.violations.join("\n  ")}`);
    ok = false;
  }

  return ok;
}

// ==============================================================================
// BOOTSTRAP COMMAND (X4, X15)
// ==============================================================================

export async function runBootstrap(rootPath: string = process.cwd()) {
  console.log("🚀 Bootstrapping repository and submodules...\n");

  // 1. Git submodule configs
  try {
    await runAsync("git", ["config", "submodule.recurse", "true"]);
    await runAsync("git", ["config", "push.recurseSubmodules", "check"]);
    console.log("✅ Configured git submodule settings (submodule.recurse, push.recurseSubmodules).");
  } catch {}

  // 2. Initialize submodules if present
  if (existsSync(join(rootPath, ".gitmodules"))) {
    console.log("   -> Initializing git submodules recursively...");
    await runAsync("git", ["submodule", "update", "--init", "--recursive"], { inheritStdio: true });
  }

  // 3. Copy example env files if real env files are missing
  const dirs = [rootPath, ...readdirSync(join(rootPath, "services")).map((d) => join(rootPath, "services", d))];
  for (const dir of dirs) {
    if (!statSync(dir).isDirectory()) continue;
    const files = readdirSync(dir);
    for (const f of files) {
      if (f.startsWith(".env.") && f.endsWith(".example")) {
        const targetName = f.replace(".example", "");
        const targetPath = join(dir, targetName);
        if (!existsSync(targetPath)) {
          writeFileSync(targetPath, readFileSync(join(dir, f)));
          console.log(`   -> Created ${join(dir, targetName)} from ${f}`);
        }
      }
    }
  }

  console.log("\n✅ Bootstrap completed successfully.");
}
