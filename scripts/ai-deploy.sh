#!/bin/bash
set -e

cd /home/opc/app

# Check if HF_TOKEN is set
if [ -z "$HF_TOKEN" ]; then
    echo "Error: HF_TOKEN is not set!"
    exit 1
fi

# Ensure .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# AI Service .env
if [ ! -f "ai-service/.env" ]; then
    echo "Creating ai-service .env file..."
    mkdir -p ai-service
    cat > ai-service/.env << 'EOL'
HF_TOKEN=$HF_TOKEN
MODEL_ENDPOINT=model_endpoint
PYTHONUNBUFFERED=1
TRANSFORMERS_CACHE=/root/.cache/huggingface
EOL
    echo "Created ai-service .env file. Please update the values."
fi

# API Server .env
if [ ! -f "api-server/.env" ]; then
    echo "Creating api-server .env file..."
    mkdir -p api-server
    cat > api-server/.env << 'EOL'
DB_USERNAME=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=postgres
EOL
    echo "Created api-server .env file. Please update the values."
fi

# Stop existing containers
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml down

# Create production override to use pre-built Docker images
cat > docker-compose.override.yaml << 'EOL'
services:
  # Disable services that are not needed in production
  frontend:
    profiles: ["disabled"]
    
  api-server:
    profiles: ["disabled"]

  cenphidb:
    profiles: ["disabled"]

  ai-service:
    build: null
    # Try to use the slim image, fallback to regular if not available
    image: lorddickson/ai-service:slim
    restart: always
    environment:
      - PYTHONUNBUFFERED=1
      - TRANSFORMERS_CACHE=/root/.cache/huggingface
      - PYTHON_ENV=production
    depends_on: []
EOL

# Try to pull the slim image first, fall back to regular if not available
if ! docker pull lorddickson/ai-service:slim; then
    echo "Slim image not available, using regular image"
    sed -i 's/lorddickson\/ai-service:slim/lorddickson\/ai-service:latest/' docker-compose.override.yaml
    docker pull lorddickson/ai-service:latest
fi

# Start the container using the pre-built image
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d ai-service

# Clean up
rm docker-compose.override.yaml

echo "Deployment completed successfully!"