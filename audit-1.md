# Build System Analysis and Hardening Plan, Version 2

**What changed from v1:** the services are separate git submodules owned by different teams. That changes the diagnosis. v1 treated this as one codebase with duplicated files. It is really a **platform with an implicit API, consumed by independent teams who can't be coordinated by a PR to one repo.** So v2 adds cross-repo contracts, policy authority, pinning and bump workflows, mock ownership, and trust boundaries. The single-repo defects from v1 are carried forward, merged and revised where the submodule reality matters.

I only have the files in your dump. Items that depend on unseen files (`.env.*`, service `Makefile`s and `package.json`s, `.dockerignore`, `.gitmodules`, CI config, app code) are marked **(verify)**.

---

## 1. Executive summary

1. **The system can lie.** Several paths exit 0 on failure, leak containers, or run checks that cannot fail. This is fixable in the root alone (Part A).
2. **The contract between root and services is implicit.** The root reaches into about a dozen conventions inside each repo: file names under `.docker/`, mock filename patterns, the `app` service name, env var names, Make targets, Dockerfile stage names, `.env.<mode>`. Any team can rename one and break the mesh with an opaque error (X1, X3).
3. **Enforcement is copy-pasted into each repo and written by the team it constrains.** Any team can weaken its own policy, and the root never re-checks. The copies have already drifted (X2).
4. **There is no cross-repo feedback loop.** A service PR can't learn it breaks the mesh, and the root can't tell which service bump broke it (X5, X6).
5. **The mesh builds from source, from whatever state the submodule is in.** It isn't reproducible and doesn't verify that the submodule is initialized, clean, or pinned to a reviewed commit (X4, X7).
6. **Mocks written by consumers will drift from providers** as teams evolve independently (X8, X9).
7. **The root executes arbitrary code from N repos on the host** with no trust boundary (X14).

**Direction:** invert control. The root owns the engine, policy, and contract. Services declare a small manifest and conform to a container-level contract, and can't opt out of checks. Adoption is phased so no team is blocked (Part H).

---

## 2. Current architecture, seen through the multi-repo lens

**Root repo:**
- `mesh.json` defines the graph, ports, and env wiring.
- `scripts/ci/*` handles topological boot, per-service Compose projects on a shared external network, log tailing, and teardown.
- `e2e/` runs a Playwright-style global suite.
- Test flow: (1) `make test` per service, (2) integrated prod-mode mesh, (3) global e2e.

**Each service repo carries:**
- `.docker/{core,mocks,overrides}`, a multi-stage `Dockerfile`, `.make/ci.mk`, `scripts/ci/*`, and `policy/*`.

**What's already good:**
- Layered Compose with policy gates.
- A Dockerfile contract.
- Services that run standalone (isolated mode), so no team needs the root to work.
- Dependency-ordered boot and non-root prod users.
- A helpful failure explainer.

**Ownership today (implicit) versus what it should be:**

| Concern | Today | Should be |
|---|---|---|
| Contract definition | Undocumented, encoded in scripts | Platform team, versioned spec |
| Policy rules (Rego, hadolint config) | Copied into each service | Platform, pinned, pulled by services, re-run by root |
| Compose stack composition (which files per stage) | Hand-maintained in ~5 files per service | Engine in the platform tool, service supplies a manifest |
| Service code, Dockerfile, compose fragments | Service team | Service team (unchanged) |
| Mocks of a provider API | Consumer team, hand-written | Provider publishes, consumers layer scenarios |
| Env wiring between services | Root `mesh.json` | Derived from manifests |
| Which SHA of each service is in the mesh | Submodule pointer, unverified | Pointer plus verified lock record |
| Global e2e tests | Root, owner unclear | Journey-level ownership |

---

## Part A. Confirmed defects in the current code

Carried from v1, now with revisions marked. These are fixable in the root without any team's cooperation.

### P0: false greens and leaks

**B1. Errors and interrupts exit 0.**
- In `run-mesh-dev/prod.ts` the `catch` calls `handleShutdown()`, which calls `process.exit(0)`.
- In `run-mesh-test.ts`, SIGINT/SIGTERM exit 0, so a cancelled CI job looks green.
- **Fix:** exit 130 on SIGINT and 143 on SIGTERM. In `catch`, set `process.exitCode = 1` and tear down.

**B2. `bootService` calls `process.exit(1)` and skips teardown.**
- A failure on service #2 leaves #1, the network, and `.mesh/` running, and `finally` never runs.
- **Fix:** throw. The caller's `finally` owns teardown.

**B3. Boot doesn't wait for health.**
- `up -d --build` returns when containers *start*.
- **Fix:** add `--wait --wait-timeout 180`. This needs a Compose version that supports it (see X19).

**B4. Shared-network name collisions.**
- The generated override makes the project's `default` network external (`global_mesh`), and `default` is where **every** service in that project lives.
- Backend and filesystem both run a `firebase-emulator`, so that name resolves to both, round-robin.
- Compose also adds the service name `app` as an alias, so `app` resolves to three containers.
- **Fix:** keep `default` private, attach only `app` to a second `mesh` network, and give it the alias:
  ```yaml
  services:
    app:
      networks:
        default: {}
        mesh: { aliases: [backend] }
  networks:
    mesh: { name: ${MESH_NETWORK}, external: true }
  ```
- Across teams this gets worse, because every team will pick names like `db`, `redis`, `app`, `mock-*`. See X11.

**B5. Volume-safety Rego never fires on merged stacks.**
- `docker compose config` emits volumes as long-form objects (`{type, source, target}`).
- `startswith(volume, "/:")` and `contains(volume, "/var/run/docker.sock")` on an object are undefined, not errors, so the root-mount and Docker-socket checks silently pass in step 4.
- **Fix:**
  ```rego
  volume_source(v) := v.source if is_object(v)
  volume_source(v) := split(v, ":")[0] if is_string(v)
  ```
- Add `conftest verify` tests with a bad fixture per rule (Part I).

**B6. Relative paths in mocks resolve against the wrong directory.**
- With multiple `-f`, Compose defaults the project directory to the first file's directory (`.docker/core`). Your `build.context: ../..` and `env_file: ../../.env.*` rely on that, but mock volume paths don't.
- The backend mount `./.docker/mocks/wiremock/filesystem` resolves under `.docker/core/`.
- It also mounts a `filesystem` dir while mappings live in `mappings/`, at `/home/wiremock` (which expects a `mappings/` child).
- The frontend mounts a non-existent `__files`, which Docker creates root-owned.
- **Fix:** pass `--project-directory <service root>` everywhere and write all paths relative to it.

**B7. Cleanup is too broad, and the e2e project is never torn down.**
- `docker rm -f $(docker ps -aq --filter name=mesh_)` matches any container whose name *contains* `mesh_`. That kills unrelated containers and other people's or CI jobs' meshes on the same daemon.
- `global-e2e` is never `down`ed and stays attached to `global_mesh`, so `network rm` silently fails (stdio ignored).
- **Fix:** a run ID (`mesh_<runId>` network and projects) plus a `com.mesh.run=<runId>` label, cleaned up by label. Register e2e as a deployment so it gets `down -v --remove-orphans`.

**B8. `spawnSync` defers signal handlers.**
- The event loop is blocked while Docker runs, so a SIGTERM to the parent (CI cancel) waits for the child, then SIGKILL, then orphans.
- **Fix:** use async `spawn`, forward signals, and run `down` in `finally`.

**B9. (Revised, more severe) Compose project names collide.**
- Service scripts pass no `-p`. Because the project directory defaults to `.docker/core`, the default project name is very likely **`core` for every service and every stage**. Verify with `docker compose <files> config --format json | jq .name`.
- Unit-test cleanup (`down -v`) can tear down a running dev stack, and concurrent runs collide.
- **Fix:** `-p ${service}-${stage}-${runId}`.

### P0/P1: config correctness

**B10. `PORT` may not reach the container (verify).** The orchestrator sets `PORT` in the *host* shell, which only affects Compose interpolation. The container's `PORT` comes from `.env.*` or the Dockerfile (`ENV PORT=3000` in the frontend). If `.env.prod` doesn't set it, the frontend listens on 3000 while everything else says 8080. **Fix:** `environment: [PORT=${PORT:?must be set}]` in the base file.

**B11. E2E and mesh-test run the app with `.env.prod`.** The `env_file` from `prod.yml` carries into test stacks. Use a dedicated env file per stack via `!override` (Compose ≥ 2.24).

**B12. `restart: unless-stopped` in test stacks hides crashes.** A crash loop never *exits*, so `--abort-on-container-exit` never fires, and you get timeouts instead of failures. Use `restart: "no"` in test stacks.

**B13. Copy-paste residue.**
- `frontend/.docker/overrides/docker-compose.orchestrator.yml` is dead (superseded by the generated override) and hardcodes the network.
- `filesystem` carries a Firebase mock and a prod override depending on `firebase-emulator`, apparently copied from backend.
- Frontend `e2e.yml` sets `API_URL=http://app:...`, which points at itself instead of the backend mock.

**B14. `mesh.json` assumptions crash opaquely.** An unknown dependency gives a bare `TypeError`, and the file is read at import time from `process.cwd()`.

**B15. `tailLogs` splits on chunk boundaries.** Use `readline` per stream.

**B16. `audit-deps.mjs` has false negatives and isn't wired in.**
- The import regex doesn't cross newlines, so multi-line imports are invisible (Rules 1–3 fail for most real imports).
- It misses `import()` and `require`, uses backslash paths on Windows, and exempts any file named `di.ts`.
- No Make target invokes it.
- Replace it with `dependency-cruiser` or `eslint-plugin-boundaries`, and wire it into the service's CI checks.
- Under the new model this becomes a *service-specific extension check* (see C3).

**B17. Root `check-infra` is an `echo`.** Root `test` and `prod` check nothing. `.PHONY` lists nonexistent targets (`docker`, `find`).

---

## Part B. Findings specific to independent repos and teams

### X1. The root–service contract is implicit and wide

The root depends on all of these inside each repo:
- File names `.docker/core/docker-compose.{base,dev,prod,standalone}.yml`
- Mock filename patterns (`docker-compose.<dep>.yml`, `.mock-<dep>.yml`, `.<dep>-mock.yml`)
- `.docker/overrides/docker-compose.<stage>.override.yml`
- `.env.dev` / `.env.prod`
- The compose service being called `app`
- `make test` existing
- Dockerfile stages `dev/test/test-e2e/prod`
- `PORT` semantics and a `/health`-style endpoint

A rename in any repo produces an opaque failure in the root, with no owner named. **Fix:** an explicit, versioned contract (C1) with a per-service manifest (C2) and a conformance suite (C3).

### X2. Policies and scripts are duplicated, drift-prone, and self-authored

- Drift is visible already:
  - `ci.mk` in frontend uses a different `tsx` check than backend and filesystem.
  - `security.rego` differs in header formatting.
  - Frontend alone has `audit-deps.mjs`.
  - Backend and filesystem still contain each other's leftovers.
- Every service carries `compose.rego` (Rules 1–4), which fully overlaps `security.rego` and `strict_ingress.rego`.
- Because policy lives in the service repo, a team can delete a rule to make its build pass, and the root's Stage 2 never runs the policies.
- **Fix (C4):** the platform publishes policy as a versioned bundle. Services pull it at a pinned version, and the root re-runs it on the mesh-merged stacks as the authority.

### X3. Cross-repo knowledge lives in the root

`envOverrides: FILESYSTEM_URL=http://filesystem:3001` encodes the *backend team's* env var name and the *filesystem team's* port. If either changes, the root breaks silently. `replaceMocks` encodes a mock-file naming convention owned by nobody. **Fix:** services declare `urlEnv` per dependency and their own port and alias. The root derives the URL.

### X4. Submodule state is never verified

Nothing checks that a submodule is initialized, clean, or at the recorded SHA, or that the SHA is on a reviewed branch.
- An uninitialized submodule produces `ENOENT` with `status: null`, reported as "Failed to boot".
- `up --build` builds from the *working tree*, so local edits or a detached experimental branch feed the "pinned" mesh.
- A SHA that only exists on a feature branch, or was force-pushed away, breaks every future clone.

**Fix (preflight, in the root):**
- Run `git submodule status --recursive` and fail on a `-` (uninitialized), `+` (SHA differs from pointer), or `U` (conflict) prefix.
- Fail if the tree is dirty (`git -C <sub> status --porcelain`).
- In CI, run `git -C <sub> merge-base --is-ancestor <sha> origin/<default-branch>`, and verify signatures if you require signed commits.
- Local git settings, installed by `make bootstrap`: `submodule.recurse=true`, `push.recurseSubmodules=check` (refuses to push a root commit whose submodule commit isn't pushed), `status.submoduleSummary=true`.
- Use relative URLs in `.gitmodules` (`../backend.git`) so forks and mirrors work.
- CI checkout must use `submodules: recursive` with a read-only token or GitHub App per repo, not a personal PAT.
- Keep `.git` out of build contexts. In a submodule it's a file, not a directory. Verify each `.dockerignore`.
- Make sure the root `pnpm-workspace.yaml`, if any, doesn't glob `services/*`, so submodule lockfiles stay independent.

### X5. No cross-repo feedback loop

- A service PR merges without knowing whether the mesh still works.
- The root only learns when someone bumps the pointer.
- **Fix:** two loops, described in Part D.
  - **Service → mesh (pre-merge gate):** the service PR runs the mesh with its commit substituted into the pinned root.
  - **Mesh → service (bump automation):** merges to a service's default branch produce automated bump PRs in the root.

### X6. Bumps must be attributable

If the root accumulates five service changes and then fails, nobody knows which one broke it, and every team blames another. **Fix:**
- One bump PR per service, opened by automation (Renovate's `git-submodules` manager or Dependabot's `gitsubmodule` ecosystem).
- A merge queue on the root so each bump is tested on top of the *current* main.
- Failed bump PRs page the owner named in the service manifest.
- Auto-revert the bump if main goes red.

### X7. The mesh isn't reproducible, and the tested artifact isn't the shipped one

- The mesh rebuilds each service from source on every run: slow, dependent on network and registry state, and not what was released.
- **Fix:**
  - Service CI publishes an immutable image (`registry/<svc>:<sha>` plus digest), with SBOM and provenance.
  - The mesh has two modes: **`build`** (local dev, builds from the submodule) and **`image`** (CI, pulls published digests).
  - The root records `mesh.lock.json` with `{service, sha, contract, imageDigest, verifiedRunUrl}`. It is written only by CI after a green run.
  - The submodule pointer already pins source, so the lock's added value is the digest plus the verification record.
  - A mesh tag (`mesh-2026.09.28.1`) is the release candidate: the set verified together.

### X8. Mock ownership and drift

- The frontend hand-maintains WireMock mappings of the backend API. The backend hand-maintains mappings of filesystem. Each provider evolves without them.
- The mocks silently keep passing while the real API changes.
- **Fix:**
  - Providers publish an OpenAPI spec and a versioned mock image generated from it (Prism/WireMock stubs), tagged with the API version. Consumers depend on `backend-api@^1`, not on files they wrote.
  - Consumers may layer scenario stubs (error injection, edge data) on top, but the baseline comes from the provider.
  - **Provider CI validates the published mock against the real service** (Schemathesis/Dredd, or Pact provider verification), and validates every stub response against the OpenAPI schema. A mock that fails validation blocks release.
  - Lint mapping sets for duplicate priorities and overlapping `urlPattern`s. Your frontend mappings rely on priority to disambiguate `/submissionSources/keys` from `/submissionSources/{id}`, which is fragile.

### X9. No API compatibility policy

- Independent teams need explicit rules. Add:
  - Semver on API contracts, declared in the manifest.
  - A breaking-change gate in provider CI (`oasdiff breaking`).
  - Expand/contract (add new, migrate consumers, remove old) for changes across repos.
  - A compatibility check in the root: each dependency's declared `range` must be satisfied by the provider's `provides.version` in the resolved mesh. This is an early, readable failure instead of a runtime 404.

### X10. Host toolchain coupling

- Each service's `ci.mk` requires host `node`, `pnpm`, and `tsx` (and `$(error)`s at parse time, so even `make help` fails without them). The root calls `make test`.
- That locks every team into the Node toolchain and makes the host a compatibility surface.
- **Fix:**
  - The contract is Docker-level (env vars, ports, health, stages, signals, logs), not language-level.
  - Ship the platform tooling as a **container image** (`mesh-tools:1.x` containing conftest, hadolint, the CLI, and the policies), plus an optional native binary. Service Makefiles become thin shims.
  - The service-specific `test` command is declared in the manifest and runs in the service's own `test` Docker stage.

### X11. Name, port, and network collisions between teams

- B4 shows the current instance (`app`, `firebase-emulator`). At N teams, any generic name (`db`, `redis`, `mock-*`) will collide.
- Ports 3000/3001/8080 are already fixed by hand in `mesh.json`, and mesh test mode publishes them to the host.
- **Fix:**
  - Private dependencies live only on the service's own default network.
  - The only mesh-visible name is the service's declared alias.
  - The root policy asserts each service claims **exactly** its own alias (a service can't claim `backend`).
  - Ports come from manifests. The root validates uniqueness only for published ports, and mesh/test stacks publish none.

### X12. Failure attribution and ownership

- Failures print Docker output but not *whose* problem it is.
- **Fix:**
  - The manifest carries `owner` (team, chat channel, CODEOWNERS group).
  - Every failure report names the service, repo, SHA, owner, and the log artifact.
  - Per-service log artifacts are saved *before* teardown (R6).
  - Global e2e tests are tagged by journey and mapped to services, so a red journey routes to the right owners.

### X13. The contract itself needs versioning and a change process

With N independent teams, "update all repos at once" is impossible.
- Put `contract: <int>` in each manifest, and have the engine support **N and N-1** with a published deprecation calendar.
- Introduce a new contract version behind a compatibility shim first.
- Push template and infra updates to repos as **automated PRs** (`copier update`, or a shared Renovate preset that bumps `.mesh-version`).
- Keep a changelog and an RFC for breaking changes.

### X14. The root executes untrusted-ish code from N repos

- Stage 1 runs `make test` on the host. Stage 2 builds and runs arbitrary Dockerfiles and Compose files from each repo, with the runner's environment.
- Risks: credential exposure, a service bind-mounting host paths, lateral access via extra networks, and resource hogging.
- **Fix (details in Part F):**
  - Run mesh CI on ephemeral, credential-less runners.
  - Run Stage 1 through the containerized toolchain.
  - Enforce mesh-level policy (no host ports, no out-of-tree bind mounts, no foreign networks or aliases, resource limits, no `container_name`).
  - Never expose secrets to fork PRs.

### X15. Multi-repo local development

Developers need to work on one service against the rest. Today the mesh boots everything from the pinned submodules. **Add:**
- `mesh up backend` boots backend plus the *closure* of its dependencies, each either real or mock: `--real filesystem` or `--mock filesystem`.
- A gitignored `mesh.local.json` to point a service at another path or worktree, so nobody has to edit tracked files.
- `make bootstrap` (init submodules, git settings, `.env` from examples) and `make doctor` (Docker/Compose/Node versions, submodule status, ports free).

### X16. Services must stay independently runnable

The current design preserves standalone operation (isolated mode). Keep it and **test it**: a conformance job that clones the service *alone*, without the root, and runs `check` and `test`. Otherwise the root can quietly become a hidden dependency.

### X17. Global e2e ownership

`e2e/` lives in the root with no visible owner, and it will be the flakiest, most cross-team surface.
- Make journey specs owned per team via CODEOWNERS, or move `e2e/` into its own repo that is itself a pinned submodule.
- Add a flake policy: a failing journey retried in isolation and quarantined with an owner and an expiry date. Never retry globally.

### X18. Env and secrets across teams

- Each team owns its `.env.*`, and fresh clones fail `compose config` when those are missing.
- **Fix:**
  - The manifest declares required env keys and their sources.
  - Services commit `.env.*.example`. `mesh init` copies them.
  - The mesh injects test-safe values.
  - Validate keys against a schema at container start.
  - Config-only checks use `env_file: [{path: ..., required: false}]`.
  - Run gitleaks in every repo.
  - Rename `sk_live_*` mock keys to `sk_test_*`, or every scanner will flag them.

### X19. Docker and Compose version skew

Features you need (`--wait`, `!override`, `depends_on.required`, `profiles`) require Compose ≥ 2.24. Teams' laptops and CI images will differ. Declare minimum versions, check them in `mesh doctor`, and pin them on CI runners.

### X20. Build-time versus runtime URL injection (verify)

The mesh injects `BACKEND_URL` at runtime via Compose `environment`. If the Next.js frontend consumes it through `NEXT_PUBLIC_*` or `next.config` rewrites, the value is baked in at `next build`, and runtime injection has no effect. The manifest should distinguish `runtimeEnv` from `buildArgs`, and the mesh should pass build args in `build` mode.

### X21. What counts as a release

Today "the mesh passes" has no durable meaning. Define: **a mesh tag = a set of `{sha, imageDigest}` verified together.** Deployment gates (`can-i-deploy` style) then check that the version being shipped appears in a verified mesh tag.

---

## Part C. Target architecture

### C1. The contract

A short, versioned document owned by the platform. Every point is checkable by a conformance test:

**Container behavior**
- Reads its listening port from `$PORT` only, with no hardcoded `EXPOSE`.
- Serves `GET <health.path>` returning 200 only when ready. Optionally a separate liveness path.
- Handles SIGTERM with a graceful exit inside 10s. Logs to stdout/stderr.
- Runs as non-root in prod. Needs no writable root filesystem, or declares tmpfs paths.

**Build**
- Dockerfile has stages `dev`, `test`, `test-e2e`, `prod`. Builds reproducibly, with pinned base images.
- Health check is present in `prod`.

**Repo**
- `mesh.service.json` at the repo root.
- `.env.*.example`. A `.dockerignore` excluding `.env*`, `.git`, `node_modules`.

**Compose**
- Fragments never publish host ports, set `container_name`, use `network_mode`, `privileged`, or mount outside the service tree.

**Standalone**
- `check` and `test` pass with the repo cloned alone.

### C2. The service manifest (illustrative)

```json
{
  "contract": 1,
  "name": "backend",
  "owner": { "team": "api", "channel": "#api-oncall", "codeowners": "@org/api-team" },
  "runtime": {
    "portEnv": "PORT",
    "defaultPort": 3000,
    "health": { "path": "/health", "startPeriod": "20s" }
  },
  "provides": { "api": "backend-api", "version": "1.4.0", "openapi": "openapi.yaml" },
  "dependencies": {
    "filesystem": {
      "api": "filesystem-api",
      "range": "^2.0.0",
      "urlEnv": "FILESYSTEM_URL",
      "mock": { "service": "mock-filesystem", "profile": "mock-filesystem" }
    }
  },
  "privateServices": ["firebase-emulator"],
  "env": { "required": ["FIRESTORE_PROJECT"], "buildArgs": [] },
  "compose": {
    "dev": ["…"], "test": ["…"], "mesh": ["…"]
  },
  "commands": { "check": "mesh check", "test": "mesh test-unit" }
}
```

The root's `mesh.json` shrinks to membership and a mode:

```json
{ "contract": 1, "services": { "filesystem": {"path":"services/filesystem"}, "backend": {"path":"services/backend"}, "frontend": {"path":"services/frontend"} } }
```

Ports, URLs, aliases, and mock wiring are all derived: `http://<alias>:<port>`. Nothing about a service's internals is written in the root.

### C3. Conformance suite

A platform-owned test kit that every service runs in its own CI (and the root runs again). Checks:
- Manifest schema, contract version supported.
- Dockerfile stages, healthcheck, non-root, no `EXPOSE`, pinned `FROM`.
- Merged-stack policy (C4).
- **Behavioral probes:** boot the `prod` image, assert `/health` becomes 200, assert the process honors `$PORT`, send SIGTERM and assert a clean exit.
- Standalone cloning check (X16).
- Mock validation against OpenAPI (X8).
- **Extension hook:** the service can register extra checks (for example the frontend's architecture audit), which run *in addition to* the mandatory set.

### C4. Policy distribution and authority

- **Single source:** a `mesh-policy` repo with versioned releases. Services and the root pull it: `conftest pull` from a git tag or OCI ref, pinned in `.mesh-version`. Renovate bumps it.
- **Root authority:** Stage 2 runs the *root's* pinned policy over every service's mesh-merged stack, regardless of what the service ran locally.
- **Waivers, not deletions:** exceptions go in `mesh.waivers.json` (rule ID, reason, approver, **expiry date**). CI fails on expired waivers, and platform CODEOWNERS must approve waiver changes.
- **Mesh-level rules** (new, run on the merged `compose config` output per service):

```rego
package mesh
import rego.v1

deny contains msg if {                      # no host ports in mesh/test
  some name, svc in input.services
  count(svc.ports) > 0
  msg := sprintf("[%v] publishes host ports", [name])
}
deny contains msg if {                      # bind mounts must stay inside the service tree
  some name, svc in input.services
  some v in svc.volumes
  v.type == "bind"
  not startswith(v.source, data.service_root)
  msg := sprintf("[%v] bind mount outside service tree: %v", [name, v.source])
}
deny contains msg if {                      # a service may only claim its own alias
  some name, svc in input.services
  some _, net in svc.networks
  some alias in net.aliases
  alias != data.service.name
  alias != name
  msg := sprintf("[%v] claims foreign alias %v", [name, alias])
}
deny contains msg if {                      # only the mesh network may be external
  some net, cfg in input.networks
  cfg.external
  cfg.name != data.mesh_network
  msg := sprintf("external network %v not allowed", [cfg.name])
}
```

Also enforce: no `container_name`, `pid/ipc: host`, `cap_add`, `privileged`, `network_mode`; resource limits present; test stacks have `restart: "no"`; no `:latest`; healthchecks on long-running services.

### C5. Tooling distribution options

| Option | Pros | Cons |
|---|---|---|
| Versioned **container image / single CLI** (`mesh`) with `.mesh-version` in each repo | Language-agnostic, one artifact, easy N/N-1 support | Needs a Docker-in-Docker or socket strategy for the tool container |
| Published npm package | Simple for Node teams | Forces Node on every team |
| Template repo plus `copier update` | Low infra | Copies drift between updates, and you still can't enforce |
| Git submodule of a shared `infra` repo inside each service | Familiar | Submodule-in-submodule pain, version skew |

**Recommendation:** the `mesh` CLI, shipped as a container image plus optional native binary, with template updates by automated PR. Service Makefiles reduce to about five lines that call `mesh check|test|dev`. The CLI supports contract N and N-1.

### C6. Engine design (root-owned)

- Generates each project's Compose args from the manifest and a single `stacks` definition, replacing the per-service `run-*.ts` and `run-check-infra.ts` duplicates.
- Uses async `spawn` with signal forwarding, a run ID, labels, `--project-directory`, `--wait`, timeouts, and a `finally` that saves logs and then tears down by label.
- Boots by topological *level* in parallel, respects closure selection (`--real/--mock`), and supports `build` and `image` modes.
- Emits JUnit plus a JSON report keyed to owners, and writes generated YAML via `JSON.stringify` with `$` escaped as `$$`.
- Replaces filename-magic mock suppression with Compose **profiles**: mocks declared with `profiles: [mock-filesystem]`, and the app uses `depends_on: { mock-filesystem: { required: false } }`. Standalone activates the profile, and the mesh doesn't.

---

## Part D. Cross-repo workflows

**D1. Service PR gate (in the service repo):**
1. `mesh check` (contract, policy, lint) and `mesh test` (unit).
2. **Mesh verify:** call the root's reusable workflow with `service` and `ref`:
   ```yaml
   jobs:
     mesh-verify:
       uses: org/root-orchestrator/.github/workflows/mesh-verify.yml@v1
       with:
         service: backend
         ref: ${{ github.event.pull_request.head.sha }}
   ```
   The root checks out at its pinned tag, substitutes the PR commit into `services/backend`, and boots the closure of backend plus its dependents. (Syntax shown is GitHub Actions; translate to your CI.) Do **not** pass secrets to fork PRs.
3. Provider-only: OpenAPI breaking-change check, mock validation, contract publish.

**D2. Bump pipeline (in the root repo):**
1. A service merges. Automation opens a **single-service** bump PR.
2. The root runs preflight (X4), full mesh in `image` mode, and global e2e.
3. The merge queue tests it on top of current main. Green merges and updates `mesh.lock.json`.
4. Red pages the service owner and blocks merge. If main goes red, auto-revert the last bump.

**D3. Promotion:**
- Mesh tags are the release candidates. A scheduled job also runs **latest-of-everything** ("canary mesh") to catch integration drift early, non-blocking, with results routed to owners.

**D4. Contract and policy releases:**
- The platform releases policy and CLI versions with a changelog.
- Renovate PRs land in each repo.
- Rollouts are phased from `warn` to `error` on a published date.

---

## Part E. Governance

- **CODEOWNERS in the root:** `mesh.json`, `scripts/`, `e2e/` (shared), and `/services/<svc>` pointers owned by that service's team.
- **Contract change process:** RFC, N/N-1 window, changelog, migration PRs raised by the platform.
- **SLOs:** mesh main red beyond an agreed window triggers an escalation, and the bump is reverted first, investigated second.
- **Waiver policy** with expiry (C4).
- **Service onboarding:** a template repo that ships with conformance, manifest, CI, and Renovate config preconfigured, so a new service starts compliant.
- **Docs:** contract spec, "how to add a service", "how to break an API safely", runbook for a red mesh.
- **Shared Renovate preset** so every repo gets the same update behavior for base images, Actions, `.mesh-version`, and mock images.

---

## Part F. Security and supply chain

- **Source trust:** branch protection and required reviews on every service's default branch (pins should only reference reviewed commits). Verify pinned SHAs are ancestors of the default branch. Signed commits/tags where feasible.
- **CI credentials:** read-only, per-repo tokens or GitHub App, short-lived. No deploy credentials in mesh jobs.
- **Fork PRs:** run on `pull_request` (not `pull_request_target` with an untrusted checkout). No secrets.
- **Execution sandbox:** ephemeral runners, egress restrictions where feasible, containerized Stage 1, resource limits on every service, and cleanup by label.
- **Mesh policy (C4)** as the technical guardrail against one team's fragment affecting the host or other teams.
- **Artifacts:** image digests, SBOM, provenance, Trivy/Grype scan, cosign signatures for deployable images. Verify signatures in `image` mode.
- **Pins:** base images by digest, mock images and tool images (`hadolint`, `conftest`, `wiremock`) by digest, and the emulator replaced by a self-built pinned image (X8/G5).
- **Secrets:** gitleaks per repo, `.env*` in `.dockerignore`, `compose config` validation that doesn't print resolved secrets.

---

## Part G. Docker, Compose, and mock hardening (carried from v1, unchanged in intent)

**G1. Dockerfile**
- `# syntax=docker/dockerfile:1`.
- Digest-pin base images and standardize the OS across services (backend/filesystem use Alpine while the frontend uses bookworm-slim).
- Pin pnpm via `packageManager` in each `package.json` **(verify how Corepack and `devEngines` interact with your pnpm version)**.
- Copy `.npmrc` and `patches/` with the lockfile before install.
- Prod stage: `ENV NODE_ENV=production`, `--chown` on artifacts, `pnpm install --prod --ignore-scripts`, and no `COPY . .`.
- Use an HTTP `/health` check rather than a bare TCP connect (Node 22 has `fetch`), with a realistic `start-period`.
- Fix the `e2e/Dockerfile`: use `--frozen-lockfile`, and use the official Playwright image at the lockfile's version instead of Alpine (musl can't run Playwright browsers).
- Consider `pnpm install --package-import-method=copy`, since the cache mount is a different filesystem.

**G2. Compose**
- Test stacks: no host ports (removes collisions and allows parallel runs), `restart: "no"`, dedicated env files.
- Dev anonymous `/app/node_modules` volume goes stale after dependency changes: use `--renew-anon-volumes` or a named volume keyed to the lockfile.
- Pre-create `test-results` and set `user:` so bind mounts aren't root-owned.
- Rename "prod" to `stack` or `integration`, since it injects emulator hosts and `CI=true` and must never be deployable. Standalone-with-mocks should report `INFRA_MODE=isolated`, and only the mesh override sets `integrated`.

**G3. hadolint and Conftest**
- Raise hadolint from `--failure-threshold error` to `warning` with a checked-in `.hadolint.yaml` of justified ignores.
- Add Dockerfile rules: digest-pinned `FROM`, non-root `USER` in prod, no `ADD` from URL, `.dockerignore` exists, and `NODE_ENV=production`.
- Build commands as **argument arrays**, not shell strings. Parse YAML with a real parser in `findServiceDefiners`, not regexes. Mount source `:ro`.

**G4. Makefiles**
- Add `.NOTPARALLEL:` so `make -j test` can't race `test-unit` and `test-e2e`.
- Add `check-infra` to `.PHONY`.
- Move the `$(error)` dependency checks into a `doctor` target, so `make help` works anywhere.

**G5. Mock and emulator images**
- Pin `wiremock/wiremock` (backend has 3.9.1, frontend `latest`).
- Replace `spine3/firebase-emulator:latest` (third-party, stale) with a self-built image from pinned `firebase-tools`. Health-check both Firestore (8080) and Auth (9099).
- Standardize mock healthchecks on one tool that exists in the pinned image **(verify curl and wget availability)**. The backend and frontend probe different endpoints (`/__admin/docs/` vs `/__admin/health`).
- Set `platform:` explicitly where images are amd64-only.

**G6. Observability of the run**
- Use `readline` per stream for log prefixing (B15).
- Add `--progress=plain` in CI, a per-stage timing summary, and preserved logs on failure.

---

## Part H. Migration roadmap (no team blocked)

The key idea is a **strangler approach**: the root adopts the new model first using adapters for the three existing services, then teams migrate at their own pace.

| Phase | Work | Needs team cooperation? |
|---|---|---|
| **0: Root-only fixes** | B1–B9, B14, B15, B17. Submodule preflight (X4). Root-owned policy run over merged mesh stacks (C4, mesh rules). Run IDs and label-based cleanup. Failure log capture. `mesh doctor` and `bootstrap`. Root unit tests with fake services (see Part I). | No |
| **1: Adapters and manifests** | The root generates `mesh.service.json` for the 3 existing services from current conventions, held in the root as legacy adapters. The engine moves to manifest-driven config, removing `envOverrides`. Introduce `mesh.lock.json`. | No |
| **2: Cross-repo loops** | Reusable `mesh-verify` workflow, bump automation with merge queue, CODEOWNERS, owner attribution. Publish the contract doc and RFC process. | Light (adding one workflow file and CODEOWNERS entries) |
| **3: Onboard teams** | Platform opens PRs adding the manifest, `.mesh-version`, thin Makefile shim, and conformance job. Policies and conformance run in **warn** mode. Providers publish OpenAPI and mock images. | Yes, but automated PRs do the work |
| **4: Enforce** | Flip to error on a published date. Delete duplicated scripts and policies from services. Remove root adapters. Image mode plus lock plus signatures in CI. | Teams fix violations |
| **5: Optimize** | Parallel levels, affected-only testing, buildx bake and remote cache, canary mesh, OpenAPI-generated mocks everywhere, Trivy/SBOM/cosign gating, e2e journey ownership and flake quarantine. | Ongoing |

---

## Part I. Definition of done: every guardrail must be provably able to fail

For each check, there is a test that breaks it on purpose and asserts the pipeline goes red. The root should carry a `fixtures/` tree with:

- A **golden mini-mesh** of three dummy services, to test the engine (topo order, cycle detection, closure selection, override generation, signal handling, teardown) without real teams.
- A **rogue service set**, each violating one rule:
  - Mounts `docker.sock` (this alone would have caught B5).
  - Claims another service's alias.
  - Publishes a host port.
  - Has no healthcheck, or listens on the wrong port.
  - Has a stale or missing manifest, or a contract version newer than the engine supports.
  - Has a dirty or uninitialized submodule.
  - Pins a SHA not on the default branch.
  - Has a mock whose response violates the provider's OpenAPI schema.
  - Has an expired waiver.
- `conftest verify` unit tests with pass and fail cases per Rego rule.
- Exit-code tests: SIGINT gives 130, SIGTERM gives 143, boot failure gives non-zero **and** leaves zero resources behind, verified by label.

Checklist:
- [ ] No path exits 0 on error, cancel, or teardown failure.
- [ ] After any run (green, red, or cancelled), zero containers or networks with the run label remain.
- [ ] The mesh can't start unless every submodule is initialized, clean, and at a reviewed, ancestor-verified SHA.
- [ ] Root policy runs on every service's merged stack, and services can't remove it.
- [ ] Every service has a valid manifest and passes conformance standalone.
- [ ] Every dependency edge has a satisfied API range and a validated mock.
- [ ] Every mesh failure names a service, SHA, and owner, and its logs are saved.
- [ ] Two mesh runs can execute concurrently on the same daemon.
- [ ] The tested artifact is the shipped artifact (image digest recorded in the lock).
 