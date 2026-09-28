.PHONY: dev prod test check-infra

check-infra:
	echo "Checking infrastructure..."

dev: check-infra
	pnpm exec tsx scripts/ci/run-mesh-dev.ts

prod: check-infra
	pnpm exec tsx scripts/ci/run-mesh-prod.ts

test: check-infra
	pnpm exec tsx scripts/ci/run-mesh-test.ts