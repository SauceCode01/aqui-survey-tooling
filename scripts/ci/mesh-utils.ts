import {
  createRunContext,
  loadMeshMembership,
  loadAllManifests,
  getBootOrder as engineGetBootOrder,
  setupMeshNetwork as engineSetupNetwork,
  teardownAll as engineTeardownAll,
  bootService as engineBootService,
  tailLogs as engineTailLogs,
  type RunContext,
  type ServiceManifest,
  type MeshMembershipConfig,
} from "./mesh-engine.js";

// Global singleton context for standard CLI runs
export const currentRunCtx: RunContext = createRunContext();
export const meshConfig: MeshMembershipConfig = loadMeshMembership();
export const manifests: Record<string, ServiceManifest> = loadAllManifests();

// Re-export mesh for backward compatibility
export const mesh = meshConfig;

export function setupMeshNetwork(ctx: RunContext = currentRunCtx) {
  return engineSetupNetwork(ctx);
}

export function teardownAll(ctx: RunContext = currentRunCtx) {
  return engineTeardownAll(ctx);
}

export function getBootOrder(m: Record<string, ServiceManifest> = manifests): string[] {
  return engineGetBootOrder(m);
}

export async function bootService(
  serviceName: string,
  mode: "dev" | "prod",
  ctx: RunContext = currentRunCtx
) {
  return engineBootService(serviceName, mode, manifests, meshConfig, ctx);
}

export function tailLogs(ctx: RunContext = currentRunCtx) {
  return engineTailLogs(manifests, meshConfig, ctx);
}