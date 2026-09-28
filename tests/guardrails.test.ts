import test from "node:test";
import assert from "node:assert/strict";
import { resolve, join } from "node:path";
import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import {
  loadMeshMembership,
  loadAllManifests,
  getBootOrder,
  verifyWaivers,
  checkSubmodules,
  runAsync,
  createRunContext,
} from "../scripts/ci/mesh-engine.js";

const FIXTURES_DIR = resolve(process.cwd(), "fixtures");

test("Guardrail 1: Golden Mini-Mesh resolves valid topological boot order", () => {
  const goldenMeshDir = join(FIXTURES_DIR, "golden-mesh");
  const manifests = loadAllManifests(goldenMeshDir);
  const order = getBootOrder(manifests);

  assert.deepStrictEqual(order, ["svc-a", "svc-b", "svc-c"]);
  assert.ok(order.indexOf("svc-a") < order.indexOf("svc-b"));
  assert.ok(order.indexOf("svc-b") < order.indexOf("svc-c"));
});

test("Guardrail 2: Circular Dependency in service dependencies is detected and throws", () => {
  const circularDir = join(FIXTURES_DIR, "rogue", "circular-mesh");
  const manifests = loadAllManifests(circularDir);

  assert.throws(
    () => {
      getBootOrder(manifests);
    },
    {
      message: /Circular dependency detected/,
    }
  );
});

test("Guardrail 3: Expired Waivers in mesh.waivers.json are flagged as errors", () => {
  const expiredWaiverDir = join(FIXTURES_DIR, "rogue", "expired-waiver");
  const result = verifyWaivers(expiredWaiverDir);

  assert.strictEqual(result.ok, false);
  assert.ok(result.violations.length > 0);
  assert.ok(result.violations[0].includes("expired"));
  assert.ok(result.violations[0].includes("no_docker_sock"));
});

test("Guardrail 4: Volume Safety Rego catches Docker socket mounts (B5)", async () => {
  const rogueFile = "fixtures/rogue/docker-sock/docker-compose.yml";
  const policyFile = "policy/compose/security.rego";

  const result = await runAsync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${process.cwd()}:/workspace:ro`,
      "-w",
      "/workspace",
      "openpolicyagent/conftest:v0.56.0",
      "test",
      rogueFile,
      "-p",
      policyFile,
    ],
    { collectOutput: true }
  );

  assert.strictEqual(result.status, 1, "Conftest must fail for docker.sock mount");
  const combined = result.stdout + result.stderr;
  assert.ok(combined.includes("mounts the Docker socket"));
});

test("Guardrail 5: Volume Safety Rego catches Host Root Directory mounts (/)", async () => {
  const rogueFile = "fixtures/rogue/root-mount/docker-compose.yml";
  const policyFile = "policy/compose/security.rego";

  const result = await runAsync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${process.cwd()}:/workspace:ro`,
      "-w",
      "/workspace",
      "openpolicyagent/conftest:v0.56.0",
      "test",
      rogueFile,
      "-p",
      policyFile,
    ],
    { collectOutput: true }
  );

  assert.strictEqual(result.status, 1, "Conftest must fail for root mount");
  const combined = result.stdout + result.stderr;
  assert.ok(combined.includes("mounts the host's root directory"));
});

test("Guardrail 6: Mesh Policy denies publishing host ports (C4)", async () => {
  const rogueFile = "fixtures/rogue/host-port/docker-compose.yml";
  const policyFile = "policy/mesh/mesh.rego";

  const result = await runAsync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${process.cwd()}:/workspace:ro`,
      "-w",
      "/workspace",
      "openpolicyagent/conftest:v0.56.0",
      "test",
      rogueFile,
      "-p",
      policyFile,
      "--namespace",
      "mesh",
    ],
    { collectOutput: true }
  );

  assert.strictEqual(result.status, 1, "Conftest must fail for published host ports");
  const combined = result.stdout + result.stderr;
  assert.ok(combined.includes("publishes host ports"));
});

test("Guardrail 7: Mesh Policy denies claiming foreign alias (C4)", async () => {
  const rogueFile = "fixtures/rogue/foreign-alias/docker-compose.yml";
  const policyFile = "policy/mesh/mesh.rego";
  const tempDir = join(process.cwd(), ".mesh", "test_data");
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
  const dataPath = join(tempDir, "data.json");
  writeFileSync(dataPath, JSON.stringify({ service: { name: "my-service" }, mesh_network: "mesh_test" }));

  try {
    const result = await runAsync(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        `${process.cwd()}:/workspace:ro`,
        "-w",
        "/workspace",
        "openpolicyagent/conftest:v0.56.0",
        "test",
        rogueFile,
        "-p",
        policyFile,
        "-d",
        ".mesh/test_data/data.json",
        "--namespace",
        "mesh",
      ],
      { collectOutput: true }
    );

    assert.strictEqual(result.status, 1, "Conftest must fail when claiming foreign alias");
    const combined = result.stdout + result.stderr;
    assert.ok(combined.includes("claims foreign alias"));
  } finally {
    if (existsSync(dataPath)) rmSync(dataPath);
  }
});

test("Guardrail 8: Dockerfile Contract catches missing HEALTHCHECK in prod stage", async () => {
  const policyDir = "policy/dockerfile";

  const result = await runAsync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${process.cwd()}:/workspace:ro`,
      "-w",
      "/workspace",
      "openpolicyagent/conftest:v0.56.0",
      "test",
      "fixtures/rogue/missing-healthcheck/Dockerfile",
      "-p",
      policyDir,
    ],
    { collectOutput: true }
  );

  assert.strictEqual(result.status, 1, "Conftest must fail for missing HEALTHCHECK in prod");
  const combined = result.stdout + result.stderr;
  assert.ok(combined.includes("missing a native HEALTHCHECK directive"));
});

test("Guardrail 9: Submodule preflight check runs without error in standalone repo", async () => {
  const check = await checkSubmodules(process.cwd());
  assert.strictEqual(check.ok, true);
});

test("Guardrail 10: Run context generates isolated run IDs and network names", () => {
  const ctx1 = createRunContext();
  const ctx2 = createRunContext();

  assert.notStrictEqual(ctx1.runId, ctx2.runId);
  assert.notStrictEqual(ctx1.networkName, ctx2.networkName);
  assert.ok(ctx1.networkName.startsWith("mesh_"));
});
