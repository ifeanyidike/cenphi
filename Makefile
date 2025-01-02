# Makefile for building and running the AI service and API server

# Definitions
PYTHON_PROTO=python -m grpc_tools.protoc \
    --proto_path=. \
    --python_out=ai-service \
    --grpc_python_out=ai-service \
    protobuf/media_analysis.proto

GO_PROTO=protoc --proto_path=. \
    --go_out=api-server/internal \
    --go-grpc_out=api-server/internal \
    protobuf/media_analysis.proto

DOCKER_COMPOSE=docker-compose

# Targets
.PHONY: all python-proto go-proto build-docker run-docker stop-docker clean

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
	$(DOCKER_COMPOSE) build

# Run Docker containers
run-docker:
	@echo "Starting Docker containers..."
	$(DOCKER_COMPOSE) up --build

# Stop Docker containers
stop-docker:
	@echo "Stopping Docker containers..."
	$(DOCKER_COMPOSE) down

# Clean generated files and artifacts
clean:
	@echo "Cleaning up generated files..."
	rm -rf ai-service/protobuf/*.py
	rm -rf api-server/internal/*.pb.go
