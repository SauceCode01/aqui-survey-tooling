import esbuild from "esbuild";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		{
			name: "transform-decorators",
			transform(code, id) {
				if (id.endsWith(".ts") && code.includes("@")) {
					const res = esbuild.transformSync(code, {
						loader: "ts",
						target: "node18",
						sourcefile: id,
						sourcemap: true,
					});
					const transformedCode = res.code.replace(
						/(_\w+ = class \{[\s\S]*?__decorateElement\(_\w+, 0, )"(\w+)"(, _\w+_decorators, _\w+\))/g,
						'$1""$3',
					);
					return {
						code: transformedCode,
						map: res.map,
					};
				}
			},
		},
	],
	test: {
		globals: true,
		environment: "jsdom",
		server: {
			deps: {
				inline: [/@solid-stack\//],
			},
		},
		testTimeout: 30000,
		hookTimeout: 30000,
		setupFiles: ["./vitest.setup.ts"],
		include: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**/*.test.{ts,tsx}"],
		exclude: ["node_modules", ".next", "dist", "e2e/**"],
	},
});
