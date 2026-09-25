# ==========================================
# Configuration
# ==========================================
PROJECT_NAME ?= $(notdir $(CURDIR))

# Compose files
BASE_COMPOSE       := .docker/docker-compose.yml
DEV_COMPOSE        := .docker/docker-compose.dev.yml
TEST_COMPOSE       := .docker/docker-compose.test.yml
PROD_COMPOSE       := .docker/docker-compose.prod.yml
STANDALONE_COMPOSE := .docker/docker-compose.standalone.yml

# Environments
ENV_DEV  := .env.dev
ENV_TEST := .env.test
ENV_PROD := .env.prod

# Compose Projects
COMPOSE_PROJECT_DEV  := $(PROJECT_NAME)-dev
COMPOSE_PROJECT_TEST := $(PROJECT_NAME)-test
COMPOSE_PROJECT_PROD := $(PROJECT_NAME)-prod

# Test Services
TEST_UNIT_SERVICE := test-unit
TEST_E2E_SERVICE  := test-e2e

# Dynamic File Inclusions
MOCK_FILES    := $(wildcard .docker/mocks/docker-compose.*.yml)
OVERRIDE_DEV  := $(wildcard .docker/overrides/docker-compose.dev.override.yml)
OVERRIDE_TEST := $(wildcard .docker/overrides/docker-compose.test.override.yml)
OVERRIDE_PROD := $(wildcard .docker/overrides/docker-compose.prod.override.yml)

# ==========================================
# Argument Processing & DRY Macros
# ==========================================
# Optimize via native 'addprefix' instead of slow 'foreach' loops
MOCK_ARGS          := $(addprefix -f ,$(MOCK_FILES))
OVERRIDE_DEV_ARGS  := $(addprefix -f ,$(OVERRIDE_DEV))
OVERRIDE_TEST_ARGS := $(addprefix -f ,$(OVERRIDE_TEST))
OVERRIDE_PROD_ARGS := $(addprefix -f ,$(OVERRIDE_PROD))

# Compose Argument Chains
DC_DEV_ARGS  := -f $(BASE_COMPOSE) -f $(DEV_COMPOSE) $(OVERRIDE_DEV_ARGS)
DC_TEST_ARGS := -f $(BASE_COMPOSE) -f $(TEST_COMPOSE) $(MOCK_ARGS) $(OVERRIDE_TEST_ARGS)
DC_PROD_ARGS := -f $(BASE_COMPOSE) -f $(PROD_COMPOSE) $(MOCK_ARGS) $(OVERRIDE_PROD_ARGS)

# Base Docker Compose Commands (Bakes in env, project, and file chains)
DC_DEV_CMD  := docker compose --env-file $(ENV_DEV) -p $(COMPOSE_PROJECT_DEV) $(DC_DEV_ARGS)
DC_TEST_CMD := docker compose --env-file $(ENV_TEST) -p $(COMPOSE_PROJECT_TEST) $(DC_TEST_ARGS)
DC_PROD_CMD := docker compose --env-file $(ENV_PROD) -p $(COMPOSE_PROJECT_PROD) $(DC_PROD_ARGS)

# Exact clean commands matching the original behavior and specific file chains
DC_CLEAN_DEV_CMD  := docker compose --env-file $(ENV_DEV) -p $(COMPOSE_PROJECT_DEV) -f $(DEV_COMPOSE) -f $(STANDALONE_COMPOSE)
DC_CLEAN_TEST_CMD := docker compose --env-file $(ENV_TEST) -p $(COMPOSE_PROJECT_TEST) -f $(TEST_COMPOSE) $(MOCK_ARGS)
DC_CLEAN_PROD_CMD := docker compose --env-file $(ENV_PROD) -p $(COMPOSE_PROJECT_PROD) -f $(PROD_COMPOSE) -f $(STANDALONE_COMPOSE) $(MOCK_ARGS)

# Shared tool runners
CONFTEST_CMD := docker run --rm -v $(CURDIR):/workspace -w /workspace openpolicyagent/conftest test

.PHONY: check-infra dev test test/cache prod clean

# ==========================================
# Helper Functions (Shared Logic)
# ==========================================

# Print mock messages (Arg 1: optional suffix for 'Prod')
define echo_mocks
	@if [ -n "$(MOCK_FILES)" ]; then \
		echo "🔌 Auto-wiring detected mocks$(if $(1), for $(1),):\n   $(MOCK_FILES)"; \
	fi
endef

# Consolidated test script runner (Arg 1: optional '--build ' flag)
define run_tests
	@echo "🧪 1. Running Quality Checks & Unit Tests$(if $(1),, (Cached))..."
	@$(DC_TEST_CMD) run $(1)--rm $(TEST_UNIT_SERVICE); \
	UNIT_CODE=$$?; \
	if [ $$UNIT_CODE -ne 0 ]; then \
		echo "❌ Unit tests failed. Aborting pipeline..."; \
		$(DC_TEST_CMD) down -v; \
		exit $$UNIT_CODE; \
	fi; \
	\
	echo "🚀 2. Unit tests passed! Booting App (Prod Mode) + Infra, running E2E$(if $(1),, (Cached))..."; \
	$(DC_TEST_CMD) up $(1)--abort-on-container-exit --attach-dependencies --exit-code-from $(TEST_E2E_SERVICE) $(TEST_E2E_SERVICE); \
	E2E_CODE=$$?; \
	\
	if [ $$E2E_CODE -ne 0 ]; then \
		echo "\n🚨 PIPELINE CRASHED! Dumping app logs for debugging... 🚨\n"; \
		$(DC_TEST_CMD) logs app; \
		echo "\n"; \
	fi; \
	\
	echo "🧹 3. Cleaning up test environment..."; \
	$(DC_TEST_CMD) down -v; \
	exit $$E2E_CODE
endef

# ==========================================
# Commands
# ==========================================

check-infra:
	@echo "🔍 1. Linting Dockerfile (Hadolint)..."
	@docker run --rm -i hadolint/hadolint hadolint --failure-threshold error - < Dockerfile
	@echo "🔍 2. Validating Dockerfile Contract (Conftest)..."
	@$(CONFTEST_CMD) Dockerfile -p policy/dockerfile/
	@echo "🔍 3. Validating Docker-Compose Architecture (Conftest)..."
	@$(CONFTEST_CMD) $(BASE_COMPOSE) $(DEV_COMPOSE) $(TEST_COMPOSE) $(PROD_COMPOSE) -p policy/compose/

# Run development server
dev: check-infra
	@echo "🚀 Booting Dev Environment..."
	$(call echo_mocks)
	@$(DC_DEV_CMD) -f $(STANDALONE_COMPOSE) up --build

# Build and run production (Mocks Included, Base included, Foreground execution)
prod: check-infra
	@echo "🚀 Booting Production Environment..."
	$(call echo_mocks,Prod)
	@$(DC_PROD_CMD) -f $(STANDALONE_COMPOSE) up --build

# Run test suite
test: check-infra
	$(call run_tests,--build )

# Run test suite using Docker cache
test/cache: check-infra
	$(call run_tests,)

# Tear down ALL containers and remove volumes across all environments
clean:
	@echo "Cleaning up $(PROJECT_NAME) environments..."
	-$(DC_CLEAN_DEV_CMD) down -v
	-$(DC_CLEAN_TEST_CMD) down -v
	-$(DC_CLEAN_PROD_CMD) down -v