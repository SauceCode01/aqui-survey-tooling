import { dag, Container, Service, Directory } from "@dagger.io/dagger";
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { MockPlugin, InfraMode, ServiceBuilderOptions } from "./types.js";

export class ServiceBuilderEngine {
  private sourceDir: Directory;
  private options: Required<ServiceBuilderOptions>;

  constructor(sourceDir: Directory, options: ServiceBuilderOptions = {}) {
    this.sourceDir = sourceDir;

    // Resolve mocks directory intelligently whether running in host or Dagger container
    let defaultMocksPath = path.resolve(import.meta.dirname, "../mocks");
    if (!fs.existsSync(defaultMocksPath)) {
      const nestedMocksPath = path.resolve(import.meta.dirname, "../../mocks");
      if (fs.existsSync(nestedMocksPath)) {
        defaultMocksPath = nestedMocksPath;
      }
    }

    this.options = {
      mocksPath: options.mocksPath ?? defaultMocksPath,
      appPort: options.appPort ?? 3000,
      baseEnv: options.baseEnv ?? {},
    };
  }

  /**
   * Evaluates infra_mode. 
   * isolated: Injects USE_CODE_STUBS flag. Skips mock containers.
   * integrated: Reads mocks folder, applies orchestrator overrides, boots containers.
   */
  private async wireInfrastructure(
    app: Container,
    infraMode: InfraMode,
    injectedServices: Record<string, Service>
  ): Promise<Container> {
    if (infraMode === "isolated") {
      return app.withEnvVariable("USE_CODE_STUBS", "true");
    }

    if (!fs.existsSync(this.options.mocksPath)) return app;

    const mockFiles = fs
      .readdirSync(this.options.mocksPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of mockFiles) {
      const fileUrl = pathToFileURL(path.join(this.options.mocksPath, file)).href;
      const module = await import(fileUrl);
      const mock: MockPlugin = module.default || module.mock;

      if (!mock || !mock.name) continue;

      // The Override Gate: Favor Orchestrator's injected service over local mock
      let targetService: Service;
      if (injectedServices[mock.name]) {
        targetService = injectedServices[mock.name];
      } else {
        targetService = await mock.buildService();
      }

      app = app.withServiceBinding(mock.name, targetService);

      const envVars = mock.getEnvVars();
      for (const [key, value] of Object.entries(envVars)) {
        app = app.withEnvVariable(key, value);
      }
    }

    for (const [key, value] of Object.entries(this.options.baseEnv)) {
      app = app.withEnvVariable(key, value);
    }

    return app;
  }

  /**
   * Helper to build a container from the sourceDir using Dockerfile target
   */
  private buildTarget(target: string): Container {
    return this.sourceDir.dockerBuild({ target });
  }

  /**
   * make dev (Local Development)
   * Target: 'dev' stage in Dockerfile
   * Mounts source code for hot-reloading.
   */
  async dev(infraMode: InfraMode, injectedServices: Record<string, Service>): Promise<Service> {
    let app = this.buildTarget("dev")
      .withMountedDirectory("/app/src", this.sourceDir.directory("src")); 

    app = await this.wireInfrastructure(app, infraMode, injectedServices);
    return app.withExposedPort(this.options.appPort).asService();
  }

  /**
   * make prod (Production Replica)
   * Target: 'prod' stage in Dockerfile
   * Hermetically sealed, optimized artifact.
   */
  async prod(infraMode: InfraMode, injectedServices: Record<string, Service>): Promise<Service> {
    let app = this.buildTarget("prod");

    app = await this.wireInfrastructure(app, infraMode, injectedServices);
    return app.withExposedPort(this.options.appPort).asService();
  }

  /**
   * make test (Testing Pipeline)
   * 1. Unit tests (isolated)
   * 2. E2E setup (integrated prod replica + e2e runner)
   */
  async test(): Promise<string> {
    // Phase 1: Unit Testing (Isolated Infra, Test Exec Mode)
    const unitRunner = this.buildTarget("test");
    await unitRunner.sync(); // Halts execution if unit tests fail

    // Phase 2: Integrated Production Subject (Spins up mocks)
    const prodSubject = await this.prod("integrated", {});

    // Phase 3: E2E Runner against the integrated subject
    try {
      return await this.buildTarget("test-e2e")
        .withServiceBinding("app", prodSubject)
        .withEnvVariable("API_URL", `http://app:${this.options.appPort}`)
        .withExec(["pnpm", "test:e2e"])
        .stdout();
    } catch {
      return await dag
        .container()
        .from("mcr.microsoft.com/playwright:v1.45.0-jammy")
        .withServiceBinding("app", prodSubject)
        .withExec(["npx", "playwright", "test", "--url", `http://app:${this.options.appPort}`])
        .stdout();
    }
  }
}
