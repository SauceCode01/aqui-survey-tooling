import { spawn, spawnSync } from "node:child_process";
import { writeFileSync, existsSync, readdirSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const meshPath = join(process.cwd(), "mesh.json");
export const mesh = JSON.parse(readFileSync(meshPath, "utf-8"));

// The orchestrator manages its own network identity
const NETWORK_NAME = "global_mesh";

export function setupMeshNetwork() {
  console.log(`\n🌐 Establishing Global Mesh Network: ${NETWORK_NAME}`);
  // Ignore errors if the network already exists
  spawnSync("docker", ["network", "create", NETWORK_NAME], { stdio: "ignore" });
}

export function teardownMeshNetwork() {
  spawnSync("docker", ["network", "rm", NETWORK_NAME], { stdio: "ignore" });
}

// Determines safe startup order (DAG Topological Sort)
export function getBootOrder(): string[] {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const serviceNames = Object.keys(mesh.services);

  serviceNames.forEach(name => { inDegree[name] = 0; adjList[name] = []; });

  serviceNames.forEach(name => {
    const config = mesh.services[name];
    config.dependsOn.forEach((dep: string) => {
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
    throw new Error("🚨 Circular dependency detected in mesh.json!");
  }
  return bootOrder;
}

function generateOrchestratorOverride(serviceName: string, mode: string): string {
  const config = mesh.services[serviceName];
  const overridesDir = join(config.path, ".docker", "overrides");
  if (!existsSync(overridesDir)) mkdirSync(overridesDir, { recursive: true });

  const overridePath = join(overridesDir, "docker-compose.orchestrator.yml");
  const envVars = Object.entries(config.envOverrides).map(([k, v]) => `      - ${k}=${v}`);

  // CRITICAL: Force INFRA_MODE=integrated and connect to the orchestrator's network
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
  return ".docker/overrides/docker-compose.orchestrator.yml";
}

function getLocalMocks(servicePath: string): string[] {
  const mocksDir = join(servicePath, ".docker/mocks");
  if (!existsSync(mocksDir)) return [];
  return readdirSync(mocksDir)
    .filter(f => f.endsWith(".yml") || f.endsWith(".yaml"))
    .flatMap(f => ["-f", join(".docker/mocks", f)]);
}

function getLocalOverride(servicePath: string, stage: string): string[] {
  const path = join(".docker/overrides", `docker-compose.${stage}.override.yml`);
  return existsSync(join(servicePath, path)) ? ["-f", path] : [];
}

export function bootService(serviceName: string, mode: "dev" | "prod") {
  const config = mesh.services[serviceName];
  console.log(`\n⏳ Booting ${serviceName} [mode: ${mode}, infra: integrated]...`);

  const orchestratorOverride = generateOrchestratorOverride(serviceName, mode);

  const composeFiles = [
    "-f", ".docker/core/docker-compose.base.yml",
    "-f", `.docker/core/docker-compose.${mode}.yml`,
    ...getLocalMocks(config.path),         
    ...getLocalOverride(config.path, mode),
    "-f", orchestratorOverride,            
    "-f", ".docker/core/docker-compose.standalone.yml",
  ];

  const { status } = spawnSync("docker", [
    "compose",
    "-p", `mesh_${serviceName}`,
    "--env-file", `.env.${mode}`,
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

export function teardownAll() {
  console.log("\n🧹 Tearing down global mesh...");
  Object.keys(mesh.services).forEach(serviceName => {
    const config = mesh.services[serviceName];
    spawnSync("docker", [
      "compose", "-p", `mesh_${serviceName}`, "down", "-v"
    ], { cwd: config.path, stdio: "ignore" });
  });
  teardownMeshNetwork();
}

export function tailLogs() {
  Object.keys(mesh.services).forEach(serviceName => {
    const config = mesh.services[serviceName];
    spawn("docker", [
      "compose", "-p", `mesh_${serviceName}`, "logs", "-f"
    ], { cwd: config.path, stdio: "inherit" });
  });
}