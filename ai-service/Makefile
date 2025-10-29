# Makefile for AI Service Cloud Run Deployment
.PHONY: help deploy build push clean logs status revisions test-local docker-clean setup

# Default target
help:
	@echo "🚀 AI Service Deployment Commands"
	@echo ""
	@echo "📦 Build & Deploy:"
	@echo "  make deploy          - Build and deploy to Cloud Run"
	@echo "  make build           - Build Docker image locally"
	@echo "  make push            - Push to registry (after build)"
	@echo ""
	@echo "☁️  Cloud Run Management:"
	@echo "  make status          - Show service status"
	@echo "  make logs            - Show recent logs"
	@echo "  make revisions       - List all revisions"
	@echo "  make traffic         - Show traffic allocation"
	@echo ""
	@echo "🧪 Testing & Development:"
	@echo "  make test-local      - Run tests locally"
	@echo "  make run-local       - Run service locally"
	@echo "  make shell           - Open container shell"
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
SERVICE_NAME = ai-service
REGION = us-central1
PROJECT_ID = cenphi-ai
IMAGE_REPO = us-central1-docker.pkg.dev/$$(gcloud config get-value project)/cenphi-ai-service-repo
IMAGE_NAME = ai-service-grpc
DOCKERFILE = Dockerfile.cloudrun
YAML_FILE = cloudrun-service-updated.yaml

# Build and Deploy
deploy:
	@echo "🚀 Deploying AI Service..."
	@echo "1️⃣  Building Docker image..."
	@export IMAGE_TAG=$$(date +%Y%m%d-%H%M%S) && \
	export IMAGE_REPO_FULL=$$(gcloud config get-value project 2>/dev/null | xargs -I {} echo "us-central1-docker.pkg.dev/{}/cenphi-ai-service-repo") && \
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
	export IMAGE_REPO_FULL=$$(gcloud config get-value project 2>/dev/null | xargs -I {} echo "us-central1-docker.pkg.dev/{}/cenphi-ai-service-repo") && \
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
	python -m pytest tests/ -v

run-local:
	@echo "🏃 Running service locally..."
	docker run -p 8080:8080 --env-file .env.local $(IMAGE_NAME):latest

shell:
	@echo "🐚 Opening container shell..."
	docker run -it --entrypoint /bin/bash $(IMAGE_NAME):latest

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
	@chmod +x cloudrun-deploy.sh
	@echo "✅ Made deploy script executable"
	@mkdir -p logs temp
	@echo "✅ Created directories"
	@touch .env.local
	@echo "✅ Created .env.local file"
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