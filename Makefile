.DEFAULT_GOAL := help
SHELL := /bin/sh
docker_compose_bin := $(shell if command -v docker-compose > /dev/null 2>&1; then echo 'docker-compose'; else echo 'docker compose'; fi)
SERVICES := $(shell find . -maxdepth 1 -type d -name "*-*" -exec test -f {}/Makefile \; -print | sed 's|./||')

.PHONY: help list-services create-network up-local down-local restart-local up-dev down-dev restart-dev logs-dev test

help:
	@echo "PulseGrid workspace"
	@echo "  make create-network"
	@echo "  make up-local"
	@echo "  make down-local"
	@echo "  make up-dev"
	@echo "  make down-dev"
	@echo "  make test"

list-services:
	@for service in $(SERVICES); do echo "$$service"; done

create-network:
	@docker network create pulsegrid-network 2>/dev/null || echo "pulsegrid-network already exists"

up-local:
	@for service in $(SERVICES); do $(MAKE) -C $$service up-local || exit 1; done

down-local:
	@for service in $(SERVICES); do $(MAKE) -C $$service down-local || exit 1; done

restart-local:
	@for service in $(SERVICES); do $(MAKE) -C $$service restart-local || exit 1; done

up-dev:
	@for service in $(SERVICES); do $(MAKE) -C $$service up-dev || exit 1; done

down-dev:
	@for service in $(SERVICES); do $(MAKE) -C $$service down-dev || exit 1; done

restart-dev:
	@for service in $(SERVICES); do $(MAKE) -C $$service restart-dev || exit 1; done

logs-dev:
	@for service in $(SERVICES); do $(MAKE) -C $$service logs-dev || exit 1; done

test:
	@for service in $(SERVICES); do $(MAKE) -C $$service test || exit 1; done
