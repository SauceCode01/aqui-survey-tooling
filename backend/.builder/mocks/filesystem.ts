import { dag, Service } from "@dagger.io/dagger";
import { MockPlugin, MockContext } from "../sdk/types.js";

export const mock: MockPlugin = {
  name: "filesystem",
  buildService(_ctx?: MockContext): Service {
    return dag
      .container()
      .from("busybox:latest")
      .withExec([
        "sh",
        "-c",
        "mkdir -p /www && echo '{\"status\":\"healthy\",\"service\":\"filesystem-mock\"}' > /www/health && httpd -f -p 8080 -h /www",
      ])
      .withExposedPort(8080)
      .asService();
  },
  getEnvVars(): Record<string, string> {
    return {
      FILESYSTEM_SERVICE_URL: "http://filesystem:8080",
    };
  },
};

export default mock;
