.DEFAULT_GOAL := help
SHELL := /bin/sh
docker_compose_bin := $(shell if command -v docker-compose > /dev/null 2>&1; then echo 'docker-compose'; else echo 'docker compose'; fi)
compose_dev := -f docker/docker-compose.dev.yml -p pulsegrid
compose_local := -f docker/docker-compose.local.yml.example -p pulsegrid

.PHONY: help create-network up-local down-local restart-local up-dev down-dev restart-dev logs-local logs-dev build test

help:
	@echo "api-gateway"
	@echo "  make create-network"
	@echo "  make up-local"
	@echo "  make down-local"
	@echo "  make up-dev"
	@echo "  make down-dev"
	@echo "  make test"

create-network:
	@docker network create pulsegrid-network 2>/dev/null || echo "pulsegrid-network already exists"

up-local:
	@$(docker_compose_bin) $(compose_local) up -d

down-local:
	@$(docker_compose_bin) $(compose_local) down

restart-local:
	@$(docker_compose_bin) $(compose_local) restart

build:
	@$(docker_compose_bin) $(compose_dev) build --no-cache --progress=plain

up-dev: build
	@$(docker_compose_bin) $(compose_dev) up -d

down-dev:
	@$(docker_compose_bin) $(compose_dev) down

restart-dev:
	@$(docker_compose_bin) $(compose_dev) restart

logs-local:
	@$(docker_compose_bin) $(compose_local) logs -f

logs-dev:
	@$(docker_compose_bin) $(compose_dev) logs -f

test:
	@cd source && npm test
