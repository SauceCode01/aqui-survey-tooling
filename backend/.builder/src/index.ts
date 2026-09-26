import { object, func, Service, dag } from "@dagger.io/dagger";
import { ServiceBuilderEngine } from "./sdk/engine.js";
import { IBuildSystem, InfraMode } from "./sdk/types.js";

@object()
export class BackendBuilder implements IBuildSystem {
  private getEngine(): ServiceBuilderEngine {
    const workspace = dag.currentWorkspace().directory(".");
    return new ServiceBuilderEngine(workspace);
  }

  @func()
  async dev(infraMode: string = "isolated", injectedServicesJSON: string = "{}"): Promise<Service> {
    const injectedServices = JSON.parse(injectedServicesJSON);
    return this.getEngine().dev(infraMode as InfraMode, injectedServices);
  }

  @func()
  async prod(infraMode: string = "integrated", injectedServicesJSON: string = "{}"): Promise<Service> {
    const injectedServices = JSON.parse(injectedServicesJSON);
    return this.getEngine().prod(infraMode as InfraMode, injectedServices);
  }

  @func()
  async test(): Promise<string> {
    return this.getEngine().test();
  }
}
