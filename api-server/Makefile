# Makefile for API Server Cloud Run Deployment
.PHONY: help deploy build push clean logs status revisions test-local docker-clean setup \
        db-up db-down db-down-to db-migrate-to db-force db-create db-reset db-clean \
        mock swagger rollback debug health metrics

# Load environment variables for database commands
-include .env.prod
export $(shell sed 's/=.*//' .env.prod 2>/dev/null)

# Default target
help:
	@echo "🚀 API Server Deployment Commands"
	@echo ""
	@echo "📦 Build & Deploy:"
	@echo "  make deploy          - Build and deploy to Cloud Run"
	@echo "  make build           - Build Docker image locally"
	@echo "  make push            - Push to registry (after build)"
	@echo ""
	@echo "☁️  Cloud Run Management:"
	@echo "  make status          - Show service status"
	@echo "  make logs            - Show recent logs"
	@echo "  make logs-tail       - Tail logs in real-time"
	@echo "  make revisions       - List all revisions"
	@echo "  make traffic         - Show traffic allocation"
	@echo "  make url             - Get service URL"
	@echo ""
	@echo "🗄️  Database Migrations:"
	@echo "  make db-up           - Run all migrations"
	@echo "  make db-down         - Rollback all migrations"
	@echo "  make db-down-to      - Rollback to version (version=N)"
	@echo "  make db-migrate-to   - Migrate to version (version=N)"
	@echo "  make db-force        - Force version (version=N)"
	@echo "  make db-create       - Create new migration (name=migration_name)"
	@echo "  make db-reset        - Drop and recreate database"
	@echo "  make db-clean        - Clean all migrations"
	@echo ""
	@echo "🧪 Testing & Development:"
	@echo "  make test-local      - Run tests locally"
	@echo "  make run-local       - Run service locally"
	@echo "  make shell           - Open container shell"
	@echo "  make swagger         - Generate Swagger docs"
	@echo "  make mock            - Generate mocks (SERVICE=service_name)"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean           - Clean local Docker images"
	@echo "  make docker-clean    - Clean all Docker artifacts"
	@echo "  make clean-revisions - Delete old revisions (keep latest 3)"
	@echo ""
	@echo "🔧 Setup & Utils:"
	@echo "  make setup           - Setup environment"
	@echo "  make check-deps      - Check dependencies"
	@echo "  make validate-yaml   - Validate YAML config"

# Variables
SERVICE_NAME = api-server
REGION = us-central1
PROJECT_ID = YOUR_PROJECT_ID
IMAGE_REPO = us-central1-docker.pkg.dev/$$(gcloud config get-value project)/cenphi-api-server-repo
IMAGE_NAME = api-server
DOCKERFILE = Dockerfile.cloudrun
YAML_FILE = cloudrun-service.yaml

# Database Migration Variables
DB_URL ?= postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?sslmode=${DB_SSLMODE}
MIGRATIONS_DIR = ./scripts/migrations
NETWORK = $(shell docker network ls --filter name=cenphi_default --filter driver=bridge --format "{{.ID}}")
MIGRATE_CMD = docker run --rm --network=${NETWORK} -v $(shell pwd)/scripts/migrations:/migrations migrate/migrate
MOCKGEN ?= mockgen
SRC_DIR ?= ./internal/services
DEST_DIR ?= ./internal/services/mocks
SERVICE ?= onboarding_service

# Build and Deploy
deploy:
	@echo "🚀 Deploying API Server..."
	@echo "1️⃣  Building Docker image..."
	@export IMAGE_TAG=$$(date +%Y%m%d-%H%M%S) && \
	export IMAGE_REPO_FULL=$$(gcloud config get-value project 2>/dev/null | xargs -I {} echo "us-central1-docker.pkg.dev/{}/cenphi-api-server-repo") && \
	docker buildx build --platform linux/amd64 -f $(DOCKERFILE) -t $(IMAGE_NAME):$$IMAGE_TAG -t $(IMAGE_NAME):latest . && \
	echo "2️⃣  Tagging image..." && \
	docker tag $(IMAGE_NAME):$$IMAGE_TAG $$IMAGE_REPO_FULL/$(IMAGE_NAME):$$IMAGE_TAG && \
	docker tag $(IMAGE_NAME):$$IMAGE_TAG $$IMAGE_REPO_FULL/$(IMAGE_NAME):latest && \
	echo "3️⃣  Pushing to registry..." && \
	docker push $$IMAGE_REPO_FULL/$(IMAGE_NAME):$$IMAGE_TAG && \
	docker push $$IMAGE_REPO_FULL/$(IMAGE_NAME):latest && \
	echo "4️⃣  Updating YAML with new image..." && \
	sed "s|image: .*|image: $$IMAGE_REPO_FULL/$(IMAGE_NAME):$$IMAGE_TAG|" $(YAML_FILE) > $(YAML_FILE).tmp && \
	mv $(YAML_FILE).tmp $(YAML_FILE) && \
	echo "5️⃣  Deploying to Cloud Run..." && \
	gcloud run services replace $(YAML_FILE) --region=$(REGION) && \
	echo "✅ Deployment complete! Image tag: $$IMAGE_TAG"

build:
	@echo "🔨 Building Docker image..."
	docker buildx build --platform linux/amd64 -f $(DOCKERFILE) -t $(IMAGE_NAME):latest .

push: build
	@echo "📤 Pushing to registry..."
	@export IMAGE_TAG=$$(date +%Y%m%d-%H%M%S) && \
	export IMAGE_REPO_FULL=$$(gcloud config get-value project 2>/dev/null | xargs -I {} echo "us-central1-docker.pkg.dev/{}/cenphi-api-server-repo") && \
	docker tag $(IMAGE_NAME):latest $$IMAGE_REPO_FULL/$(IMAGE_NAME):$$IMAGE_TAG && \
	docker tag $(IMAGE_NAME):latest $$IMAGE_REPO_FULL/$(IMAGE_NAME):latest && \
	docker push $$IMAGE_REPO_FULL/$(IMAGE_NAME):$$IMAGE_TAG && \
	docker push $$IMAGE_REPO_FULL/$(IMAGE_NAME):latest && \
	echo "✅ Pushed with tag: $$IMAGE_TAG"

# Cloud Run Management
status:
	@echo "📊 Service Status:"
	gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="table(metadata.name,status.url,status.traffic)"

logs:
	@echo "📋 Recent Logs:"
	gcloud run services logs read $(SERVICE_NAME) --region=$(REGION) --limit=50

logs-tail:
	@echo "📋 Tailing Logs:"
	gcloud run services logs tail $(SERVICE_NAME) --region=$(REGION)

revisions:
	@echo "📜 Service Revisions:"
	gcloud run revisions list --service=$(SERVICE_NAME) --region=$(REGION)

traffic:
	@echo "🚦 Traffic Allocation:"
	gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="table(status.traffic[].revisionName,status.traffic[].percent)"

url:
	@gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="value(status.url)"

# Testing & Development
test-local:
	@echo "🧪 Running local tests..."
	go test ./... -v

run-local:
	@echo "🏃 Running service locally..."
	docker run -p 8081:8081 --env-file .env.local $(IMAGE_NAME):latest

shell:
	@echo "🐚 Opening container shell..."
	docker run -it --entrypoint /bin/sh $(IMAGE_NAME):latest

# Validation
validate-yaml:
	@echo "✅ Validating YAML configuration..."
	gcloud run services replace $(YAML_FILE) --region=$(REGION) --dry-run

check-deps:
	@echo "🔍 Checking dependencies..."
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
	@command -v gcloud >/dev/null 2>&1 || { echo "❌ gcloud CLI not installed"; exit 1; }
	@docker --version
	@gcloud version --format="value(Google Cloud SDK)"
	@echo "✅ All dependencies OK"

# Cleanup
clean:
	@echo "🧹 Cleaning local Docker images..."
	-docker rmi $(IMAGE_NAME):latest 2>/dev/null || true
	@echo "✅ Cleanup complete"

docker-clean:
	@echo "🧹 Deep Docker cleanup..."
	docker system prune -f
	docker image prune -f
	@echo "✅ Deep cleanup complete"

clean-revisions:
	@echo "🧹 Cleaning old revisions (keeping latest 3)..."
	@gcloud run revisions list --service=$(SERVICE_NAME) --region=$(REGION) --format="value(metadata.name)" --limit=100 | tail -n +4 | while read revision; do \
		echo "Deleting revision: $$revision"; \
		gcloud run revisions delete $$revision --region=$(REGION) --quiet; \
	done
	@echo "✅ Old revisions cleaned"

# Setup
setup:
	@echo "🔧 Setting up environment..."
	@mkdir -p logs data
	@echo "✅ Created directories"
	@touch .env.local
	@echo "✅ Created .env.local file"
	@echo "📝 Please update .env.local with your environment variables"
	@echo "🎉 Setup complete"

# Emergency commands
rollback:
	@echo "⏪ Rolling back to previous revision..."
	@PREV_REVISION=$$(gcloud run revisions list --service=$(SERVICE_NAME) --region=$(REGION) --format="value(metadata.name)" --limit=2 | tail -1) && \
	gcloud run services update-traffic $(SERVICE_NAME) --to-revisions=$$PREV_REVISION=100 --region=$(REGION) && \
	echo "✅ Rolled back to: $$PREV_REVISION"

debug:
	@echo "🔍 Debug Information:"
	@echo "Service: $(SERVICE_NAME)"
	@echo "Region: $(REGION)"
	@echo "Project: $(PROJECT_ID)"
	@echo "Current directory: $$(pwd)"
	@echo "Dockerfile exists: $$(test -f $(DOCKERFILE) && echo "✅ Yes" || echo "❌ No")"
	@echo "YAML file exists: $$(test -f $(YAML_FILE) && echo "✅ Yes" || echo "❌ No")"

health:
	@SERVICE_URL=$$(gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="value(status.url)") && \
	curl -s "$$SERVICE_URL/health" || echo "❌ Health check failed"

# Performance monitoring
metrics:
	@echo "📈 Service Metrics:"
	gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --format="table(spec.template.spec.containers[0].resources.limits)"

# ============================================================================
# Database Migration Commands
# ============================================================================

db-up:
	@echo "🗄️  Running all migrations..."
	@echo "Detected network: ${NETWORK}"
	@echo "Database URL: $(DB_URL)"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) -verbose up

db-down:
	@echo "⏬ Rolling back all migrations..."
	@echo "Detected network: ${NETWORK}"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) -verbose down -all

db-down-to:
	@echo "⏬ Rolling back to version: $(version)"
	@echo "Detected network: ${NETWORK}"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) -verbose goto $(version)

db-migrate-to:
	@echo "🔄 Migrating to version: $(version)"
	@echo "Detected network: ${NETWORK}"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) -verbose goto $(version)

db-force:
	@echo "⚠️  Forcing database version to: $(version)"
	@echo "Detected network: ${NETWORK}"
	$(MIGRATE_CMD) -path=/migrations -database=$(DB_URL) force $(version)

db-create:
	@echo "📝 Creating new migration: $(name)"
	@mkdir -p $(MIGRATIONS_DIR)
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

db-reset:
	@echo "🗑️  Dropping and recreating database..."
	$(MIGRATE_CMD) -path=/migrations -database=${DB_URL} drop -f

db-clean:
	@echo "🧹 Rolling back all migrations..."
	$(MIGRATE_CMD) -path=/migrations -database=${DB_URL} down -all
	@echo "🔄 Forcing version to 0 (clean state)..."
	$(MIGRATE_CMD) -path=/migrations -database=${DB_URL} force 0

# ============================================================================
# Code Generation
# ============================================================================

swagger:
	@echo "📚 Generating Swagger documentation..."
	swag init -g cmd/main.go --parseDependency

mock:
	@echo "🎭 Generating mock for service: $(SERVICE)"
	$(MOCKGEN) -source=$(SRC_DIR)/$(SERVICE).go -destination=$(DEST_DIR)/mock_$(SERVICE).go -package=mocks
