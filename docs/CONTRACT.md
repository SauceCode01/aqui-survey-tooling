# Platform Service Contract Specification

**Contract Version**: 1  
**Authority**: Platform Team (`@org/platform-team`)  
**Status**: Active  

---

## 1. Overview

This document specifies the interface and operational boundaries between the Root Orchestrator Platform and individual Services within `aqui-survey-tooling`.

The platform conforms to a **container-level contract**, decoupling the root build engine from language-specific host toolchains. Every service must conform to this contract, verified both independently (standalone) and collectively (within the mesh).

---

## 2. Container Lifecycle & Runtime Behavior

1. **Port Binding**:
   - The container **MUST** read its listening HTTP port from `$PORT` (defaulting to the service's declared `runtime.defaultPort` if unset).
   - The container **MUST NOT** include hardcoded `EXPOSE` directives in its Dockerfile.

2. **Health Probes**:
   - The container **MUST** serve an HTTP readiness endpoint at `GET <runtime.health.path>` (e.g. `/health` or `/api/health`).
   - The endpoint **MUST** return HTTP 200 within `runtime.health.startPeriod` after container start.
   - The `prod` Dockerfile stage **MUST** define a native `HEALTHCHECK` directive invoking this endpoint.

3. **Signals and Termination**:
   - The container process **MUST** run as PID 1 (or under a proper init system like `tini`).
   - The container **MUST** gracefully handle `SIGTERM` and shut down within 10 seconds.
   - The container **MUST** log diagnostic and operational messages to `stdout` and `stderr`.

4. **Least Privilege**:
   - The `prod` container **MUST** run as a non-root user (e.g., `USER node` or `USER 1000:1000`).
   - The container **MUST NOT** require `privileged: true` or `cap_add`.

---

## 3. Dockerfile Stages Contract

Every service Dockerfile **MUST** provide the following multi-stage build targets:

| Stage Target | Purpose | Description |
|---|---|---|
| `dev` | Local development | Includes development dependencies, mounts source tree, runs dev server. Default `CMD` required. |
| `test` | Unit & integration testing | Runs isolated unit tests, linting, and type checking (`CMD ["pnpm", "test"]`). |
| `test-e2e` | Service-level E2E | Runs local service E2E tests against local mocks. |
| `prod` | Production / Integrated runtime | Pinned base image, production dependencies only (`--prod`), non-root user, native `HEALTHCHECK`, foreground `CMD`. |

---

## 4. Repository & Manifest Structure

Every service repository **MUST** contain:

1. **`mesh.service.json`**: Manifest located at the repository root declaring:
   - `contract`: Integer contract version (currently `1`).
   - `name`: Unique service identifier.
   - `owner`: Contact and codeowner metadata (`team`, `channel`, `codeowners`).
   - `runtime`: Runtime port, health path, and start timeout.
   - `provides`: API identifier, semver version, and optional OpenAPI spec file.
   - `dependencies`: Consumed APIs, required semver ranges, injected URL env var name, and local mock profile.
   - `privateServices`: List of internal backing services (e.g., databases, emulators) isolated to the service's private network.
   - `commands`: Standard commands for `check` and `test`.

2. **Environment Files**:
   - Services **MUST** check in `.env.dev.example`, `.env.prod.example`, and `.env.test.example`.
   - Real secret values or live credentials (`sk_live_*`) **MUST NEVER** be committed.

3. **`.dockerignore`**:
   - **MUST** exclude `.env*`, `.git`, and `node_modules`.

---

## 5. Compose Stack Guidelines & Security Rules

1. **Ingress & Ports**:
   - Compose fragments for `dev`, `prod`, `test`, and `mesh` **MUST NOT** publish host ports (`ports: ["...:..."]`).
   - Host port mapping is reserved exclusively for `docker-compose.standalone.yml` (for local standalone testing outside the mesh).

2. **Networking**:
   - Each service stack operates inside its own private `default` bridge network.
   - Private backing services (e.g., `firebase-emulator`, `postgres`, `redis`) **MUST ONLY** attach to the private `default` network.
   - Only the primary `app` container attaches to the external `mesh` network with its declared alias.
   - Services **MUST NOT** specify `network_mode: host` or claim aliases belonging to other services.

3. **Volumes & Isolation**:
   - Bind mounts **MUST NOT** reference directories outside the service repository tree.
   - Bind mounting `/` (host root) or `/var/run/docker.sock` is strictly forbidden.
   - Services **MUST NOT** define `container_name` (to avoid naming collisions across concurrent runs).

---

## 6. Standalone Operability

A service **MUST** be fully functional when cloned independently:
- `make check-infra` (or `mesh check`) and `make test` (or `mesh test`) **MUST** pass without requiring the root orchestrator or external submodules.
- Missing dependencies **MUST** be simulated via local mocks (e.g. WireMock).

---

## 7. Versioning and Deprecation Policy

- Manifests declare `"contract": <integer>`.
- The root orchestrator supports versions **N** and **N - 1**.
- Deprecations are communicated via platform RFCs with a minimum 60-day migration window before support removal.
