import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config.mjs";

export default defineConfig({
  plugins: baseConfig.plugins ?? [],
  test: {
    fileParallelism: false,
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts", "./e2e/setup.ts"],
    testTimeout: 240000,
    hookTimeout: 240000,
    include: ["e2e/**/*.e2e.test.{ts,tsx}", "e2e/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
  },
});
