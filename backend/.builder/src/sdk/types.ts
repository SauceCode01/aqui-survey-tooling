import { Service, Container } from "@dagger.io/dagger";

export type InfraMode = "isolated" | "integrated";
export type ExecMode = "dev" | "test" | "prod";

export interface IBuildSystem {
  dev(infraMode: InfraMode, injectedServices: Record<string, Service>): Promise<Service>;
  prod(infraMode: InfraMode, injectedServices: Record<string, Service>): Promise<Service>;
  test(): Promise<string>;
}

export interface MockContext {
  sourceDir: Container;
}

export interface MockPlugin {
  name: string; // The internal DNS name (e.g., "firebase", "filesystem")
  buildService(ctx?: MockContext): Promise<Service> | Service;
  getEnvVars(): Record<string, string>;
}

export interface ServiceBuilderOptions {
  mocksPath?: string;
  appPort?: number;
  baseEnv?: Record<string, string>;
}
