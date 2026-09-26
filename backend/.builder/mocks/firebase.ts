import { dag, Service } from "@dagger.io/dagger";
import { MockPlugin, MockContext } from "../sdk/types.js";

export const mock: MockPlugin = {
  name: "firebase",
  buildService(_ctx?: MockContext): Service {
    return dag
      .container()
      .from("spine3/firebase-emulator:latest")
      .withEnvVariable("GCP_PROJECT", "demo-test-project")
      .withExposedPort(8080)
      .withExposedPort(9099)
      .asService();
  },
  getEnvVars(): Record<string, string> {
    return {
      FIRESTORE_EMULATOR_HOST: "firebase:8080",
      FIREBASE_AUTH_EMULATOR_HOST: "firebase:9099",
      FIREBASE_PROJECT_ID: "demo-test-project",
      GCP_PROJECT: "demo-test-project",
    };
  },
};

export default mock;
