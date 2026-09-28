.NOTPARALLEL:
.PHONY: help doctor bootstrap check-infra conformance dev prod test lock

help:
	@node --import tsx scripts/mesh.ts help

doctor:
	@node --import tsx scripts/mesh.ts doctor

bootstrap:
	@node --import tsx scripts/mesh.ts bootstrap

check-infra:
	@node --import tsx scripts/mesh.ts check

conformance: check-infra

dev: check-infra
	node --import tsx scripts/ci/run-mesh-dev.ts

prod: check-infra
	node --import tsx scripts/ci/run-mesh-prod.ts

test: check-infra
	node --import tsx scripts/ci/run-mesh-test.ts

lock:
	@node --import tsx scripts/mesh.ts lock