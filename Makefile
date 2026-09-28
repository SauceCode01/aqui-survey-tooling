
include .make/ci.mk


look:  
	find scripts .make package.json services/*/.docker services/*/Dockerfile services/*/.make services/*/scripts services/*/policy e2e/docker-compose.yml services/*/mesh.service.json e2e/Dockerfile mesh.json mesh.lock.json mesh.waivers.json -type f -exec tail -v -n +1 {} +

kill: 
	docker kill $$(docker ps -q)
