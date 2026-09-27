import { dag, Container, Directory, object, func } from "@dagger.io/dagger"

@object()
export class Backend {
  /**
   * Build a specific stage from a local Dockerfile
   */
  @func()
  async buildtest(source: Directory): Promise<string> {
    await source
      .dockerBuild({ 
        dockerfile: "Dockerfile", 
        target: "test"
      })
      .sync(); // sync() executes the build and halts if it fails

    return "Tests passed during Docker build!";
  }

  /**
   * Run tests for a Node.js project inside a container
   */
  @func()
  async test(source: Directory): Promise<string> {
    return await dag
      .container()
      .from("node:20-alpine")
      .withDirectory("/src", source)
      .withWorkdir("/src")
      .withExec(["npm", "install"])
      .withExec(["npm", "test"])
      .stdout()
  }
}