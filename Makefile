
include .make/ci.mk

look: 
	find mesh.json scripts services/*/.docker services/*/scripts e2e/docker-compose.yml e2e/Dockerfile -type f -exec tail -v -n +1 {} +

kill: 
	docker kill $$(docker ps -q)
