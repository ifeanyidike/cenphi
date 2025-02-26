#!/bin/bash
set -e

cd /home/opc/app

# Check if HF_TOKEN is set 
if [ -z "$HF_TOKEN" ]; then
    echo "Error: HF_TOKEN is not set!"
    exit 1
fi

# AI Service .env
if [ ! -f "ai-service/.env" ]; then
    echo "Creating ai-service .env file..."
    mkdir -p ai-service
    cat > ai-service/.env << EOL
HF_TOKEN=$HF_TOKEN
MODEL_ENDPOINT=model_endpoint
PYTHONUNBUFFERED=1
TRANSFORMERS_CACHE=/root/.cache/huggingface
EOL
    echo "Created ai-service .env file."
fi

# API Server .env
if [ ! -f "api-server/.env" ]; then
     echo "Creating api-server .env file..."
     mkdir -p api-server
     cat > api-server/.env << EOL
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
cat > docker-compose.override.yaml << EOL
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
    image: lorddickson/ai-service:slim
    restart: always
    environment:
      - PYTHONUNBUFFERED=1
      - TRANSFORMERS_CACHE=/root/.cache/huggingface
      - PYTHON_ENV=production
    depends_on: []
EOL

# Try to pull the slim image first, fall back to regular if not available
echo "Attempting to pull slim image..."
if ! docker pull lorddickson/ai-service:slim; then
    echo "Slim image not available, using regular image"
    sed -i 's/lorddickson\/ai-service:slim/lorddickson\/ai-service:latest/' docker-compose.override.yaml
    docker pull lorddickson/ai-service:latest
else
    # Verify image size
    IMAGE_SIZE=$(docker images lorddickson/ai-service:slim --format "{{.Size}}")
    echo "Slim image size: $IMAGE_SIZE"
    
    # Check if this is possibly a GIF or lightweight service
    # Let's assume images under 2MB might be okay for certain cases,
    # but issue a warning just in case
    if [[ "$IMAGE_SIZE" == *"MB"* ]]; then
        SIZE_NUM=$(echo $IMAGE_SIZE | sed 's/MB//')
        if (( $(echo "$SIZE_NUM < 2" | bc -l) )); then
            echo "WARNING: Slim image is very small (< 2MB). This is unusual for most services."
            echo "If this is expected (e.g., a simple proxy or GIF service), you can ignore this warning."
            echo "Otherwise, there might be an issue with the image build or slimming process."
            echo "Continuing with deployment, but please monitor the service closely."
        fi
    elif [[ "$IMAGE_SIZE" == *"kB"* ]] || [[ "$IMAGE_SIZE" == *"KB"* ]]; then
        echo "WARNING: Slim image is only kilobytes in size."
        echo "This is extremely small for a container. If this is a minimal service, this might be expected."
        echo "Continuing with deployment, but please verify the service works as expected."
    fi
fi

# Start the container using the pre-built image
echo "Starting AI service container..."
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d ai-service

# Verify container started properly
sleep 5
if [ $(docker ps | grep ai-service | wc -l) -eq 0 ]; then
    echo "ERROR: AI service container failed to start. Check logs:"
    docker logs $(docker ps -a | grep ai-service | awk '{print $1}')
    exit 1
else
    echo "AI service container is running!"
    # Display running container info
    docker ps | grep ai-service
fi

# Check container health after a short delay
sleep 10
CONTAINER_ID=$(docker ps | grep ai-service | awk '{print $1}')
if [ ! -z "$CONTAINER_ID" ]; then
    # Print recent logs
    echo "Recent container logs:"
    docker logs --tail 20 $CONTAINER_ID
    
    # Check if container is still running
    if [ $(docker ps | grep ai-service | wc -l) -eq 0 ]; then
        echo "WARNING: Container started but has stopped. Check for errors."
        exit 1
    fi
fi

# Clean up
rm docker-compose.override.yaml

echo "Deployment completed successfully!"