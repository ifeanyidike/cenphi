# Makefile for building and running the AI service and API server

# Definitions
PYTHON_PROTO=python -m grpc_tools.protoc \
    --proto_path=. \
    --python_out=ai-service \
    --grpc_python_out=ai-service \
    protobuf/intelligence.proto

GO_PROTO=protoc --proto_path=. \
    --go_out=api-server \
    --go-grpc_out=api-server \
    protobuf/intelligence.proto

DOCKER_COMPOSE=docker-compose
DOCKER_COMPOSE_DEV=docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml
DOCKER_COMPOSE_PROD=docker-compose -f docker-compose.yaml -f docker-compose.prod.yaml
SLIM_IMAGE_NAME ?= cenphi-ai-service:latest

# Targets
.PHONY: all python-proto go-proto build-docker run-docker start-docker stop-docker stop-run-docker slim-docker build-docker-dev run-docker-dev start-docker-dev stop-run-docker-dev clean

# Default target
all: python-proto go-proto build-docker

# Generate Python gRPC code
python-proto:
	@echo "Generating Python gRPC code..."
	$(PYTHON_PROTO)

# Generate Go gRPC code
go-proto:
	@echo "Generating Go gRPC code..."
	$(GO_PROTO)

# Build Docker images
build-docker:
	@echo "Building Docker images..."
	$(DOCKER_COMPOSE_PROD) build

# Run Docker containers
run-docker:
	@echo "Starting Docker containers..."
	$(DOCKER_COMPOSE_PROD) up --build

# Run Docker containers
start-docker:
	@echo "Starting Docker containers..."
	$(DOCKER_COMPOSE_PROD) up

# Stop Docker containers
stop-docker:
	@echo "Stopping Docker containers..."
	$(DOCKER_COMPOSE) down

# Stops and runs docker
stop-run-docker:
	$(DOCKER_COMPOSE) down -v && $(DOCKER_COMPOSE_PROD) up --build


slim-docker-full:
	slim build \
	--http-probe=false \
	--env-file slim.env \
	--include-path '/root/.cache/huggingface' \
    --include-path '/opt/venv' \
	$(IMAGE_NAME)

slim-docker-full-v2:
	docker-slim build \
	--http-probe=false \
	--env-file slim.env \
	--include-path '/root/.cache/huggingface' \
    --include-path '/opt/venv' \
	cenphi-ai-service:latest
# Produces a slim image of the ai container
slim-docker:
	slim build \
	--env-file slim.env \
	--http-probe=false \
	--include-path "/opt/venv/lib/python3.12/site-packages/torch/bin/torch_shm_manager" \
	--include-path /opt/venv/lib/python3.12/site-packages/transformers/utils/dummy_vision_objects.py \
	cenphi-ai-service:latest

# Build Docker images
build-docker-dev:
	@echo "Building Docker images..."
	$(DOCKER_COMPOSE_DEV) build

# Run Docker containers
run-docker-dev:
	@echo "Starting Docker containers..."
	$(DOCKER_COMPOSE_DEV) up --build

# Run Docker containers
start-docker-dev:
	@echo "Starting Docker containers..."
	$(DOCKER_COMPOSE_DEV) up


stop-run-docker-dev:
	$(DOCKER_COMPOSE) down -v && $(DOCKER_COMPOSE_DEV) up --build


# Clean generated files and artifacts
clean:
	@echo "Cleaning up generated files..."
	rm -rf ai-service/protobuf/*.py
	rm -rf api-server/internal/*.pb.go
