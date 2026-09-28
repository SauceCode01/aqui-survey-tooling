.NOTPARALLEL:
.PHONY: help doctor bootstrap check-infra conformance dev prod test lock

help:
	@pnpm exec tsx scripts/mesh.ts help

doctor:
	@pnpm exec tsx scripts/mesh.ts doctor

bootstrap:
	@pnpm exec tsx scripts/mesh.ts bootstrap

check-infra:
	@pnpm exec tsx scripts/mesh.ts check

conformance: check-infra

dev: check-infra
	pnpm exec tsx scripts/ci/run-mesh-dev.ts

prod: check-infra
	pnpm exec tsx scripts/ci/run-mesh-prod.ts

test: check-infra
	pnpm exec tsx scripts/ci/run-mesh-test.ts

lock:
	@pnpm exec tsx scripts/mesh.ts lock