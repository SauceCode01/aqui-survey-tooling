# ==============================================================================
# Configuration
# ==============================================================================
COMPOSE_DEV  = docker-compose.dev.yml
COMPOSE_PROD = docker-compose.prod.yml
COMPOSE_TEST = docker-compose.test.yml

# The service whose exit code determines if 'make test' passes or fails
TEST_TARGET  = test-api

.PHONY: init update sync rm-submodule dev prod test test-dev test-prod down logs ci ci-service ci-list ci-validate

# ==============================================================================
# Execution Environments
# ==============================================================================

# Brings up all services in development mode with hot-reloading
dev:
	docker compose -f $(COMPOSE_DEV) up --build

# Brings up all services in production mode (in the background)
prod:
	docker compose -f $(COMPOSE_PROD) up --build -d

# Spins up the APIs, runs the test API, then automatically tears everything down
test:
	@docker compose -f $(COMPOSE_TEST) up --build --abort-on-container-exit --exit-code-from $(TEST_TARGET); \
	EXIT_CODE=$$?; \
	docker compose -f $(COMPOSE_TEST) down -v; \
	exit $$EXIT_CODE

# ==============================================================================
# Container Lifecycle & Logs
# ==============================================================================

# Stop and remove all ecosystem containers
down:
	docker compose -f $(COMPOSE_DEV) down -v 2>/dev/null || true
	docker compose -f $(COMPOSE_PROD) down -v 2>/dev/null || true
	docker compose -f $(COMPOSE_TEST) down -v 2>/dev/null || true

# Stream logs from running containers
logs:
	docker compose logs -f

# ==============================================================================
# Git Submodule Maintenance
# ==============================================================================

# Initial setup after cloning
init:
	git submodule update --init --recursive

# Pull latest commits and update submodules
update:
	git pull origin main
	git submodule update --init --recursive

# Fetch upstream commits from submodule remotes
sync:
	git submodule update --remote --merge

rm-submodule:
	@if [ -z "$(path)" ]; then \
		echo "Error: Please specify the submodule path. Example: make rm-submodule path=libs/my-repo"; \
		exit 1; \
	fi
	$(eval CLEAN_PATH := $(patsubst %/,%,$(path)))
	@echo "Removing submodule at: $(CLEAN_PATH)"
	git submodule deinit -f $(CLEAN_PATH)
	git rm -f $(CLEAN_PATH)
	rm -rf .git/modules/$(CLEAN_PATH)
	@echo "Submodule successfully removed. Don't forget to commit your changes!"

# ==============================================================================
# CI/CD Pipeline Local Execution
# ==============================================================================

# Run the complete CI pipeline locally across all discovered services
ci:
	node .github/scripts/ci-engine.mjs --run-all

# Run CI for a single service (e.g. make ci-service name=backend)
ci-service:
	@if [ -z "$(name)" ]; then \
		echo "Error: Please specify the service name. Example: make ci-service name=backend"; \
		exit 1; \
	fi
	node .github/scripts/ci-engine.mjs --run-service=$(name)

# List all discovered services in the monorepo
ci-list:
	node .github/scripts/ci-engine.mjs --list

# Validate all service configuration files
ci-validate:
	node .github/scripts/ci-engine.mjs --validate