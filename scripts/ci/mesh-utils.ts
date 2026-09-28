function getLocalMocks(servicePath: string, replaceMocks: Record<string, string>): string[] {
  const mocksDir = join(servicePath, ".docker/mocks");
  if (!existsSync(mocksDir)) return [];

  // Expand the shorthand keys into the actual possible filenames
  // e.g. "filesystem" -> ["docker-compose.filesystem.yml", "docker-compose.mock-filesystem.yml"]
  const mocksToSuppress = Object.keys(replaceMocks).flatMap(key => [
    `docker-compose.${key}.yml`,
    `docker-compose.mock-${key}.yml`
  ]);

  return readdirSync(mocksDir)
    .filter(file => file.endsWith(".yml") || file.endsWith(".yaml"))
    // Filter out any mock file that matches the expanded shorthand names
    .filter(file => !mocksToSuppress.includes(file))
    .flatMap(file => ["-f", join(".docker/mocks", file)]);
}