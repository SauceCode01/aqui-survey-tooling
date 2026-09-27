import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Scans the mocks directory and returns all YAML files as compose arguments.
 * Example return: ["-f", ".docker/mocks/firebase.yml", "-f", ".docker/mocks/redis.yml"]
 */
export function getMocks(): string[] {
  const mocksDir = ".docker/mocks";
  if (!existsSync(mocksDir)) return [];
  
  return readdirSync(mocksDir)
    .filter(file => file.endsWith(".yml") || file.endsWith(".yaml"))
    .flatMap(file => ["-f", join(mocksDir, file)]);
}

/**
 * Checks if a specific override file exists and returns it.
 * Example return: ["-f", ".docker/overrides/docker-compose.dev.override.yml"]
 */
export function getOverride(stage: string): string[] {
  const path = join(".docker/overrides", `docker-compose.${stage}.override.yml`);
  return existsSync(path) ? ["-f", path] : [];
}