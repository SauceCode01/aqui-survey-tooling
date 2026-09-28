.PHONY: dev prod test-unit test-e2e test

# ==============================================================================
# Dependency Checks
# ==============================================================================

ifeq (, $(shell command -v docker 2> /dev/null))
    $(error "Error: docker is not installed. Please install Docker Desktop first.")
endif

ifeq (, $(shell command -v node 2> /dev/null))
    $(error "Error: node is not installed. We recommend installing it via nvm.")
endif

ifeq (, $(shell command -v pnpm 2> /dev/null))
    $(error "Error: pnpm is not installed. Please install it.")
endif

ifneq ($(shell pnpm exec tsx --version > /dev/null 2>&1; echo $$?),0)
    $(error "Error: tsx not found. You likely need to run 'pnpm install' or 'pnpm install tsx'")
endif

# ==============================================================================
# Targets
# ==============================================================================

check-infra:
	node --import tsx scripts/ci/run-check-infra.ts
	
# Boots the isolated development environment with hot-reloading
dev: check-infra
	node --import tsx scripts/ci/run-dev.ts

# Boots the production environment with dynamic local mocks
prod: check-infra
	node --import tsx scripts/ci/run-prod.ts

# Runs fast, isolated unit tests
test-unit: check-infra
	node --import tsx scripts/ci/run-test-unit.ts

# Boots the production-like environment, mocks, and runs integration/E2E tests
test-e2e: check-infra
	node --import tsx scripts/ci/run-test-e2e.ts

# The master test command (Fulfills your architectural plan)
# First runs unit tests. If they pass, it proceeds to spin up the E2E environment.
test: test-unit test-e2e