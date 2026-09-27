import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getMocks, getOverride } from './utils.js';

function runCommand(command: string, stepName: string, targetFile?: string) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error(`🚨 INFRASTRUCTURE CHECK FAILED 🚨`);
    console.error('='.repeat(60));
    console.error(`Failed Step : ${stepName}`);
    if (targetFile) {
      console.error(`Target File : ${targetFile}  <-- FIX THIS FILE`);
    }
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

function getYamlFiles(dirPath: string): string[] {
  const pwd = process.cwd();
  const fullPath = join(pwd, dirPath);
  if (!existsSync(fullPath)) return [];
  
  return readdirSync(fullPath)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map(file => join(dirPath, file));
}

function main() {
  const pwd = process.cwd();

  // 1. Hadolint (Single container)
  console.log('\n🔍 1. Linting Dockerfile...');
  runCommand(
    'docker run --rm -i hadolint/hadolint hadolint --failure-threshold error - < Dockerfile',
    'Dockerfile Linting',
    'Dockerfile'
  );

  // 2. Dockerfile Contract (Single container)
  console.log('\n🔍 2. Validating Dockerfile Contract...');
  runCommand(
    `docker run --rm -v "${pwd}:/project" -w /project openpolicyagent/conftest test Dockerfile -p policy/dockerfile/`,
    'Dockerfile Contract',
    'Dockerfile'
  );

  // ---------------------------------------------------------
  // Strategy A: Batched Partial File Checks (Lightning Fast ⚡)
  // ---------------------------------------------------------
  const coreFiles = getYamlFiles('.docker/core').filter(f => !f.includes('standalone.yml'));
  const mockFiles = getYamlFiles('.docker/mocks');
  const overrideFiles = getYamlFiles('.docker/overrides');
  
  const partialFilesList = [...coreFiles, ...mockFiles, ...overrideFiles];

  if (partialFilesList.length > 0) {
    console.log(`\n🔍 3. Validating All Partial Files (${partialFilesList.length} files batched)...`);
    const allFilesArg = partialFilesList.join(' ');
    
    // Scans ALL partial files simultaneously in ONE container boot
    runCommand(
      `docker run --rm -v "${pwd}:/project" -w /project openpolicyagent/conftest test ${allFilesArg} -p policy/compose/`,
      'Partial File Validation',
      'One or more compose files in .docker/'
    );
  }

  // ---------------------------------------------------------
  // Strategy B: Merged State Checks
  // ---------------------------------------------------------
  console.log('\n🔍 4. Validating Merged Architecture states...');

  const environments = [
    { 
      name: 'Dev', 
      files: [
        "-f", ".docker/core/docker-compose.base.yml",
        "-f", ".docker/core/docker-compose.dev.yml",
        ...getOverride("dev"),
        "-f", ".docker/core/docker-compose.standalone.yml"
      ]
    },
    { 
      name: 'Prod', 
      files: [
        "-f", ".docker/core/docker-compose.base.yml",
        "-f", ".docker/core/docker-compose.prod.yml",
        ...getMocks(),
        ...getOverride("prod"),
        "-f", ".docker/core/docker-compose.standalone.yml"
      ]
    },
    {
      name: 'E2E',
      files: [
        "-f", ".docker/core/docker-compose.base.yml",
        "-f", ".docker/core/docker-compose.prod.yml",
        "-f", ".docker/core/docker-compose.e2e.yml",
        ...getMocks(),
        ...getOverride("prod"),
        ...getOverride("e2e")
      ]
    }
  ];

  for (const env of environments) {
    console.log(`     -> Checking ${env.name} stack...`);
    const composeArgs = env.files.join(' ');
    
    runCommand(
      `PUBLIC_PORT=3000 PORT=3000 docker compose ${composeArgs} config | docker run --rm -i -v "${pwd}:/project" -w /project openpolicyagent/conftest test - -p policy/compose/security.rego`,
      `Merged Architecture Validation (${env.name})`,
      `Combined ${env.name} Stack`
    );
  }

  console.log('\n✅ All infrastructure and contract checks passed.');
}

main();