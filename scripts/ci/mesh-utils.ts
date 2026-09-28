import { spawn, spawnSync } from "node:child_process";
import { writeFileSync, existsSync, readdirSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const meshPath = join(process.cwd(), "mesh.json");
export const mesh = JSON.parse(readFileSync(meshPath, "utf-8"));

const NETWORK_NAME = "global_mesh";
const ROOT_OVERRIDES_DIR = join(process.cwd(), ".mesh", "overrides");

const activeDeployments = new Map<string, { path: string, composeFiles: string[], envFile: string }>();

export function setupMeshNetwork() {
  console.log(`\n🧹 Sweeping for orphaned containers from previous sessions...`);
  spawnSync('sh', ['-c', 'docker rm -f $(docker ps -a -q --filter "name=mesh_") >/dev/null 2>&1']);
  spawnSync("docker", ["network", "rm", NETWORK_NAME], { stdio: "ignore" });

  console.log(`🌐 Establishing Global Mesh Network: ${NETWORK_NAME}`);
  spawnSync("docker", ["network", "create", NETWORK_NAME], { stdio: "ignore" });
  
  if (!existsSync(ROOT_OVERRIDES_DIR)) {
    mkdirSync(ROOT_OVERRIDES_DIR, { recursive: true });
  }
}

export function teardownMeshNetwork() {
  spawnSync("docker", ["network", "rm", NETWORK_NAME], { stdio: "ignore" });
  if (existsSync(join(process.cwd(), ".mesh"))) {
    rmSync(join(process.cwd(), ".mesh"), { recursive: true, force: true });
  }
}

export function getBootOrder(): string[] {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const serviceNames = Object.keys(mesh.services);

  serviceNames.forEach(name => { inDegree[name] = 0; adjList[name] = []; });

  serviceNames.forEach(name => {
    const config = mesh.services[name];
    const dependencies = Object.values(config.replaceMocks) as string[];
    dependencies.forEach(dep => {
      adjList[dep].push(name);
      inDegree[name]++;
    });
  });

  const bootQueue: string[] = serviceNames.filter(name => inDegree[name] === 0);
  const bootOrder: string[] = [];

  while (bootQueue.length > 0) {
    const current = bootQueue.shift()!;
    bootOrder.push(current);
    adjList[current].forEach(dependent => {
      inDegree[dependent]--;
      if (inDegree[dependent] === 0) bootQueue.push(dependent);
    });
  }

  if (bootOrder.length !== serviceNames.length) {
    throw new Error("🚨 Circular dependency detected in mesh.json replaceMocks!");
  }
  return bootOrder;
}

function generateOrchestratorOverride(serviceName: string): string {
  const config = mesh.services[serviceName];
  const overridePath = join(ROOT_OVERRIDES_DIR, `${serviceName}.yml`);
  const envVars = Object.entries(config.envOverrides).map(([k, v]) => `      - ${k}=${v}`);

  const content = `
services:
  app:
    networks:
      default:
        aliases:
          - ${serviceName}
    environment:
      - INFRA_MODE=integrated
${envVars.join("\n")}
networks:
  default:
    name: ${NETWORK_NAME}
    external: true
`;
  writeFileSync(overridePath, content);
  return overridePath;
}

function getLocalMocks(servicePath: string, replaceMocks: Record<string, string>): string[] {
  const mocksDir = join(servicePath, ".docker/mocks");
  if (!existsSync(mocksDir)) return [];

  const mocksToSuppress = Object.keys(replaceMocks).flatMap(key => [
    `docker-compose.${key}.yml`,
    `docker-compose.mock-${key}.yml`,
    `docker-compose.${key}-mock.yml`
  ]);

  return readdirSync(mocksDir)
    .filter(file => file.endsWith(".yml") || file.endsWith(".yaml"))
    .filter(file => !mocksToSuppress.includes(file))
    .flatMap(file => ["-f", join(".docker/mocks", file)]);
}

function getLocalOverride(servicePath: string, stage: string): string[] {
  const path = join(".docker/overrides", `docker-compose.${stage}.override.yml`);
  return existsSync(join(servicePath, path)) ? ["-f", path] : [];
}

export function bootService(serviceName: string, mode: "dev" | "prod") {
  const config = mesh.services[serviceName];
  console.log(`⏳ Booting ${serviceName} [mode: ${mode}, infra: integrated]...`);

  const orchestratorOverrideAbsolute = generateOrchestratorOverride(serviceName);

  const composeFiles = [
    "-f", ".docker/core/docker-compose.base.yml",
    "-f", `.docker/core/docker-compose.${mode}.yml`,
    ...getLocalMocks(config.path, config.replaceMocks),         
    ...getLocalOverride(config.path, mode),
    "-f", orchestratorOverrideAbsolute,       
    "-f", ".docker/core/docker-compose.standalone.yml",
  ];

  const envFile = `.env.${mode}`;
  activeDeployments.set(serviceName, { path: config.path, composeFiles, envFile });

  const { status } = spawnSync("docker", [
    "compose",
    "-p", `mesh_${serviceName}`,
    "--env-file", envFile,
    ...composeFiles,
    "up", "-d", "--build"
  ], {
    cwd: config.path,
    stdio: "inherit",
    env: { ...process.env, PORT: config.port.toString(), PUBLIC_PORT: config.port.toString() }
  });

  if (status !== 0) {
    console.error(`🚨 Failed to boot ${serviceName}`);
    process.exit(1);
  }
}

// ------------------------------------------------------------------
// TEARDOWN MANAGEMENT (Nuclear & Process-safe)
// ------------------------------------------------------------------
let isTearingDown = false;
const activeLogStreams: ReturnType<typeof spawn>[] = [];

export function teardownAll() {
  if (isTearingDown) return; 
  isTearingDown = true;
  
  console.log("\n🧹 Tearing down global mesh...");

  activeLogStreams.forEach(stream => {
    try { stream.kill("SIGKILL"); } catch (e) {}
  });

  console.log("   -> Force stopping active containers...");
  spawnSync('sh', ['-c', 'docker rm -f $(docker ps -a -q --filter "name=mesh_") >/dev/null 2>&1']);

  console.log("   -> Cleaning up networks and volumes...");
  activeDeployments.forEach(({ path, composeFiles, envFile }, serviceName) => {
    spawnSync("docker", [
      "compose", "-p", `mesh_${serviceName}`,
      "--env-file", envFile,
      ...composeFiles,
      "down", "-v"
    ], { cwd: path, stdio: "ignore" });
  });

  teardownMeshNetwork();
  console.log("✅ Teardown complete. Goodbye.");
}

// ------------------------------------------------------------------
// SMART LOGGING ENGINE
// ------------------------------------------------------------------
const colors = ["\x1b[36m", "\x1b[32m", "\x1b[33m", "\x1b[35m", "\x1b[34m", "\x1b[31m"];
const resetColor = "\x1b[0m";

export function tailLogs() {
  Object.keys(mesh.services).forEach((serviceName, index) => {
    const config = mesh.services[serviceName];
    const color = colors[index % colors.length];

    const child = spawn("docker", [
      "compose", "-p", `mesh_${serviceName}`, "logs", "-f"
    ], { cwd: config.path });

    activeLogStreams.push(child);

    const processLine = (line: string, stream: NodeJS.WriteStream) => {
      if (!line.trim()) return;

      const pipeIndex = line.indexOf("|");
      
      if (pipeIndex !== -1 && pipeIndex < 60) {
        const rawPrefix = line.substring(0, pipeIndex);
        const logContent = line.substring(pipeIndex + 1);
        
        // 1. Strip ANSI color codes Docker injected
        let cleanPrefix = rawPrefix.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
        
        // 2. Strip trailing instance numbers (e.g. "app-1" -> "app")
        cleanPrefix = cleanPrefix.replace(/-\d+$/, '');
        
        // 3. Strip Docker's project name prefix if it injected it (e.g. "mesh_backend-app" -> "app")
        const projectPrefix = `mesh_${serviceName}-`;
        if (cleanPrefix.startsWith(projectPrefix)) {
          cleanPrefix = cleanPrefix.substring(projectPrefix.length);
        }

        // Output correctly bound: [backend.app] or [backend.firebase-emulator]
        const finalPrefix = `${color}[${serviceName}.${cleanPrefix}]${resetColor} `.padEnd(35 + color.length + resetColor.length);
        stream.write(`${finalPrefix}${logContent}\n`);
      } else {
        const fallbackPrefix = `${color}[${serviceName}]${resetColor} `.padEnd(32 + color.length + resetColor.length);
        stream.write(`${fallbackPrefix}${line}\n`);
      }
    };

    child.stdout.on("data", (data) => {
      data.toString().split("\n").forEach((line: string) => processLine(line, process.stdout));
    });

    child.stderr.on("data", (data) => {
      data.toString().split("\n").forEach((line: string) => processLine(line, process.stderr));
    });
  });
}