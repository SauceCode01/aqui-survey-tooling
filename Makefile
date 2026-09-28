
include .make/ci.mk

look: 
	find mesh.json scripts services/*/.docker -type f -exec tail -v -n +1 {} +

kill: 
	docker kill $$(docker ps -q)
