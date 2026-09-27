# .make/ci.mk
.PHONY: dev prod test-unit test-e2e test

# Boots the isolated development environment with hot-reloading
dev:
	pnpm exec tsx scripts/ci/run-dev.ts

# Boots the production environment with dynamic local mocks
prod:
	pnpm exec tsx scripts/ci/run-prod.ts

# Runs fast, isolated unit tests
test-unit:
	pnpm exec tsx scripts/ci/run-test-unit.ts

# Boots the production-like environment, mocks, and runs integration/E2E tests
test-e2e:
	pnpm exec tsx scripts/ci/run-test-e2e.ts

# The master test command (Fulfills your architectural plan)
# First runs unit tests. If they pass, it proceeds to spin up the E2E environment.
test: test-unit test-e2e