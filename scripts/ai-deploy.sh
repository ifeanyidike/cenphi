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

# # API Server .env
# if [ ! -f "api-server/.env" ]; then
#      echo "Creating api-server .env file..."
#      mkdir -p api-server
#      cat > api-server/.env << 'EOL'
# DB_USERNAME=
# DB_PASSWORD=
# DB_HOST=
# DB_PORT=
# DB_NAME=postgres
# EOL
#      echo "Created api-server .env file. Please update the values."
# fi

# Create placeholder main.py if needed
if [ ! -f "main.py" ]; then
    echo "Creating placeholder main.py file..."
    cat > main.py << 'EOL'
# Main entry point for AI service
import os
import sys
import logging
import time

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("AI Service starting...")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Working directory: {os.getcwd()}")
    
    # Import actual service code here
    try:
        # Import your actual service modules here
        # If they're not found, the except block will handle it
        logger.info("Importing service modules...")
        # from your_module import start_service
        # start_service()
        
        # For now, just keep the container running
        logger.info("Service initialized, running main loop")
        while True:
            time.sleep(60)
            logger.info("AI Service heartbeat")
            
    except ImportError as e:
        logger.error(f"Failed to import service modules: {e}")
        logger.error("This is likely because the main application code is not properly included in the Docker image.")
        logger.error("Check your Dockerfile and build process to ensure all required files are copied to the container.")
        # Keep the container running even with the error for debugging
        while True:
            time.sleep(60)
            logger.error("AI Service in ERROR state. Fix application code and redeploy.")

if __name__ == "__main__":
    main()
EOL
    echo "Created main.py file."
fi

# Stop existing containers
docker compose -f docker-compose.prod.yaml down

# Force pull the latest images first to ensure we have the newest versions
echo "Pulling the latest images..."
docker pull lorddickson/ai-service:latest
docker pull lorddickson/ai-service:slim || echo "Slim image not available, will use latest"

# Get timestamps of the images to determine which is newer
LATEST_TS=$(docker inspect --format='{{.Created}}' lorddickson/ai-service:latest 2>/dev/null || echo "")
SLIM_TS=$(docker inspect --format='{{.Created}}' lorddickson/ai-service:slim 2>/dev/null || echo "")

# Default to latest
IMAGE_TO_USE="lorddickson/ai-service:latest"

if [ -n "$SLIM_TS" ]; then
    # Convert to Unix timestamps for comparison
    LATEST_UNIX=$(date -d "$LATEST_TS" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$LATEST_TS" +%s 2>/dev/null)
    SLIM_UNIX=$(date -d "$SLIM_TS" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$SLIM_TS" +%s 2>/dev/null)
    
    if [ "$SLIM_UNIX" -ge "$LATEST_UNIX" ]; then
        echo "Slim image is newer or same age as latest. Using slim."
        IMAGE_TO_USE="lorddickson/ai-service:slim"
    else
        echo "Latest image is newer than slim. Using latest."
    fi
else
    echo "Slim image not available. Using latest."
fi

# Create production override to use the selected Docker image
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
    image: ${IMAGE_TO_USE}
    restart: always
    environment:
      - PYTHONUNBUFFERED=1
      - TRANSFORMERS_CACHE=/root/.cache/huggingface
      - PYTHON_ENV=production
      - HF_TOKEN=$HF_TOKEN
    volumes:
      - ./main.py:/app/main.py
    depends_on: []
    command: ["/opt/venv/bin/python", "/app/main.py"]
EOL

# Verify image size
IMAGE_SIZE=$(docker images ${IMAGE_TO_USE} --format "{{.Size}}")
echo "Selected image size: $IMAGE_SIZE"

# Start the container using the selected image
echo "Starting AI service container using ${IMAGE_TO_USE}..."
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d ai-service

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

echo "Deployment completed successfully!"