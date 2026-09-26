
.PHONY: check-infra dev test test/cache prod clean


# Local Development: Hot-reloading, zero external containers (code stubs only)
dev:
	@echo "Booting Dev (Isolated)..."
	dagger call -m .builder dev --infra-mode isolated up

# Local Production: Hermetic binary, boots all mock dependencies
prod:
	@echo "Booting Prod Replica (Integrated)..."
	dagger call -m .builder prod --infra-mode integrated up

# Test Suite: Unit (Isolated) -> Prod Mesh (Integrated) -> E2E
test:
	@echo "Running Test Pipeline..."
	dagger call -m .builder test