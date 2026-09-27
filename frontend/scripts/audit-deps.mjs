import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../src");

const violations = [];

function getAllFiles(dir, fileList = []) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			getAllFiles(filePath, fileList);
		} else if (/\.(tsx?|jsx?)$/.test(file)) {
			fileList.push(filePath);
		}
	}
	return fileList;
}

const allFiles = getAllFiles(srcDir);

for (const filePath of allFiles) {
	const relativePath = path.relative(srcDir, filePath);
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split("\n");

	const isTest =
		filePath.includes("__tests__") ||
		filePath.endsWith(".test.ts") ||
		filePath.endsWith(".test.tsx") ||
		filePath.endsWith(".spec.ts");
	const isDiRegistry =
		filePath.includes("di/container.ts") ||
		filePath.includes("di/provider.tsx") ||
		filePath.includes("/di.ts");
	const isShared = relativePath.startsWith("shared/");
	const isRouteHandler = relativePath.startsWith("app/api/");

	// Parse imports
	const importRegex = /(?:import|export)\s+(?:.*?from\s+)?["'](.*?)["']/g;
	let match;

	while ((match = importRegex.exec(content)) !== null) {
		const importPath = match[1];

		// Rule 1: No concrete API adapter imports in components, hooks, or pages
		if (!isTest && !isDiRegistry) {
			if (/features\/[^/]+\/api\//.test(importPath)) {
				violations.push({
					file: relativePath,
					rule: "NO_CONCRETE_API_IMPORT",
					message: `Importing concrete API adapter "${importPath}" is forbidden. Depend only on abstract contracts in features/*/types and resolve via DI.`,
				});
			}
		}

		// Rule 2: Shared layer must never import from features, app, or di
		if (isShared) {
			if (
				importPath.startsWith("@/features") ||
				importPath.startsWith("@/app") ||
				importPath.startsWith("@/di") ||
				/^\.\.\/.*(?:features|app|di)/.test(importPath)
			) {
				violations.push({
					file: relativePath,
					rule: "SHARED_LAYER_LEAK",
					message: `Shared layer cannot import from features, app, or di ("${importPath}"). Shared layer must be independent.`,
				});
			}
		}

		// Rule 3: Cross-feature private imports are forbidden
		const featureMatch = relativePath.match(/^features\/([^/]+)\//);
		if (featureMatch) {
			const currentFeature = featureMatch[1];
			const foreignFeatureMatch = importPath.match(
				/@\/features\/([^/]+)\/(api|components)/,
			);
			if (foreignFeatureMatch && foreignFeatureMatch[1] !== currentFeature) {
				violations.push({
					file: relativePath,
					rule: "CROSS_FEATURE_LEAK",
					message: `Feature "${currentFeature}" cannot import private "${foreignFeatureMatch[2]}" from foreign feature "${foreignFeatureMatch[1]}" ("${importPath}").`,
				});
			}
		}
	}

	// Rule 4: No direct fetch in components or presentation hooks (must use callApi or DI)
	if (
		!isTest &&
		!isRouteHandler &&
		!relativePath.includes("shared/lib/apiClient.ts")
	) {
		const fetchRegex = /\bfetch\s*\(/g;
		if (fetchRegex.test(content)) {
			// Check line by line to ignore comments
			lines.forEach((line, idx) => {
				if (
					/\bfetch\s*\(/.test(line) &&
					!line.trim().startsWith("//") &&
					!line.trim().startsWith("/*")
				) {
					violations.push({
						file: `${relativePath}:${idx + 1}`,
						rule: "NO_DIRECT_FETCH",
						message:
							"Direct fetch() call in presentation code is forbidden. Use callApi or feature API adapters.",
					});
				}
			});
		}
	}

	// Rule 5: No pub/sub or window CustomEvent
	if (!isTest) {
		if (content.includes("CustomEvent") || content.includes("dispatchEvent")) {
			lines.forEach((line, idx) => {
				if (
					(line.includes("CustomEvent") || line.includes("dispatchEvent")) &&
					!line.trim().startsWith("//")
				) {
					violations.push({
						file: `${relativePath}:${idx + 1}`,
						rule: "NO_FRONTEND_PUBSUB",
						message:
							"Frontend pub/sub and CustomEvent dispatching is forbidden. Use React state/context or DI.",
					});
				}
			});
		}
	}
}

if (violations.length > 0) {
	console.error(
		`\n❌ Found ${violations.length} architectural boundary violation(s):\n`,
	);
	for (const v of violations) {
		console.error(`  [${v.rule}] in ${v.file}:`);
		console.error(`    ${v.message}\n`);
	}
	process.exit(1);
} else {
	console.log(
		`\n✅ Architecture Boundary Check Passed: All ${allFiles.length} files conform to dependency rules.\n`,
	);
	process.exit(0);
}
