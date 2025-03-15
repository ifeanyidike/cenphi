# #!/bin/bash
# set -e

# cd /home/opc/app

# # Check if HF_TOKEN is set 
# if [ -z "$HF_TOKEN" ]; then
#     echo "Error: HF_TOKEN is not set!"
#     exit 1
# fi

# # Check for GITHUB_SHA
# if [ -n "$GITHUB_SHA" ]; then
#     echo "Deploying specific version: $GITHUB_SHA"
#     IMAGE_TAG="lorddickson/ai-service:${GITHUB_SHA}"
#     # Try to pull the specific SHA-tagged image
#     docker pull $IMAGE_TAG || {
#         echo "Image with SHA tag not found, falling back to latest"
#         IMAGE_TAG="lorddickson/ai-service:latest"
#     }
# else
#     echo "No specific version provided, using latest"
#     IMAGE_TAG="lorddickson/ai-service:latest"
# fi

# # AI Service .env
# echo "Creating ai-service .env file..."
# mkdir -p ai-service
# cat > ai-service/.env << EOL
# HF_TOKEN=$HF_TOKEN
# MODEL_ENDPOINT=model_endpoint
# PYTHONUNBUFFERED=1
# TRANSFORMERS_CACHE=/root/.cache/huggingface
# EOL
# echo "Created ai-service .env file."

# # Ensure main.py directory exists
# mkdir -p /home/opc/app/ai-service

# # Create or update main.py in the ai-service directory
# cat > /home/opc/app/ai-service/main.py << 'EOL'
# # Main entry point for AI service
# import os
# import sys
# import logging
# import time

# # Set up logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

# def main():
#     logger.info("AI Service starting...")
#     logger.info(f"Python version: {sys.version}")
#     logger.info(f"Working directory: {os.getcwd()}")
#     logger.info(f"Directory contents: {os.listdir('.')}")
    
#     # Import actual service code here
#     try:
#         # Import your actual service modules here
#         logger.info("Importing service modules...")
        
#         # For now, just keep the container running
#         logger.info("Service initialized, running main loop")
#         while True:
#             time.sleep(60)
#             logger.info("AI Service heartbeat")
            
#     except ImportError as e:
#         logger.error(f"Failed to import service modules: {e}")
#         logger.error("This is likely because the main application code is not properly included in the Docker image.")
#         # Keep the container running even with the error for debugging
#         while True:
#             time.sleep(60)
#             logger.error("AI Service in ERROR state. Fix application code and redeploy.")

# if __name__ == "__main__":
#     main()
# EOL

# # Stop and remove existing containers
# echo "Stopping existing containers..."
# docker compose -f docker-compose.prod.yaml down || true
# docker rm -f $(docker ps -a -q --filter name=ai-service) 2>/dev/null || true

# # Clear Docker cache for the specific image
# echo "Clearing Docker cache for ai-service image..."
# docker rmi lorddickson/ai-service:latest 2>/dev/null || true
# docker rmi lorddickson/ai-service:slim 2>/dev/null || true
# if [ -n "$GITHUB_SHA" ]; then
#     docker rmi lorddickson/ai-service:${GITHUB_SHA} 2>/dev/null || true
# fi

# # Force pull the latest images
# echo "Pulling the latest images..."
# docker pull $IMAGE_TAG || { echo "Failed to pull image $IMAGE_TAG"; exit 1; }

# # Try to pull slim image if we're using latest
# if [ "$IMAGE_TAG" = "lorddickson/ai-service:latest" ]; then
#     docker pull lorddickson/ai-service:slim || echo "Slim image not available, will use latest"
    
#     # Check which image to use based on timestamps
#     LATEST_TS=$(docker inspect --format='{{.Created}}' lorddickson/ai-service:latest 2>/dev/null || echo "")
#     SLIM_TS=$(docker inspect --format='{{.Created}}' lorddickson/ai-service:slim 2>/dev/null || echo "")
    
#     # Default to latest
#     IMAGE_TO_USE="lorddickson/ai-service:latest"
    
#     if [ -n "$SLIM_TS" ]; then
#         # Convert to Unix timestamps for comparison
#         LATEST_UNIX=$(date -d "$LATEST_TS" +%s 2>/dev/null || date -jf "%Y-%m-%dT%H:%M:%S" "$LATEST_TS" +%s 2>/dev/null)
#         SLIM_UNIX=$(date -d "$SLIM_TS" +%s 2>/dev/null || date -jf "%Y-%m-%dT%H:%M:%S" "$SLIM_TS" +%s 2>/dev/null)
        
#         if [ "$SLIM_UNIX" -ge "$LATEST_UNIX" ]; then
#             echo "Slim image is newer or same age as latest. Using slim."
#             IMAGE_TO_USE="lorddickson/ai-service:slim"
#         else
#             echo "Latest image is newer than slim. Using latest."
#         fi
#     else
#         echo "Slim image not available. Using latest."
#     fi
# else
#     # Using specific SHA tag
#     IMAGE_TO_USE=$IMAGE_TAG
# fi

# # Create production override to use the selected Docker image
# cat > docker-compose.override.yaml << EOL
# services:
#   # Disable services that are not needed in production
#   frontend:
#     profiles: ["disabled"]
    
#   api-server:
#     profiles: ["disabled"]
  
#   cenphidb:
#     profiles: ["disabled"]
  
#   ai-service:
#     image: ${IMAGE_TO_USE}
#     restart: always
#     ports:
#       - "50052:50052"
#     environment:
#       - PYTHONUNBUFFERED=1
#       - TRANSFORMERS_CACHE=/root/.cache/huggingface
#       - PYTHON_ENV=production
#       - HF_TOKEN=$HF_TOKEN
#     volumes:
#       # Do not mount local application code over container code
#       # Just mount the environment file
#       - ./ai-service/.env:/app/.env
#       # Mount cache directory for model persistence
#       - ai-model-cache:/root/.cache/huggingface
#     depends_on: []
#     command: ["/opt/venv/bin/python", "/app/main.py"]

# volumes:
#   ai-model-cache:
# EOL

# # Verify image size and details
# IMAGE_SIZE=$(docker images ${IMAGE_TO_USE} --format "{{.Size}}")
# IMAGE_ID=$(docker images ${IMAGE_TO_USE} --format "{{.ID}}")
# IMAGE_CREATED=$(docker images ${IMAGE_TO_USE} --format "{{.CreatedAt}}")
# echo "Selected image: $IMAGE_TO_USE"
# echo "Image ID: $IMAGE_ID"
# echo "Image size: $IMAGE_SIZE"
# echo "Image created: $IMAGE_CREATED"

# # Start the container using the selected image
# echo "Starting AI service container using ${IMAGE_TO_USE}..."
# docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d ai-service

# # Verify container started properly
# echo "Waiting for container to start..."
# sleep 10

# if [ $(docker ps | grep ai-service | wc -l) -eq 0 ]; then
#     echo "ERROR: AI service container failed to start. Check logs:"
#     # Get the container ID even if it's not running
#     CONTAINER_ID=$(docker ps -a | grep ai-service | awk '{print $1}')
#     if [ -n "$CONTAINER_ID" ]; then
#         docker logs $CONTAINER_ID
#     else
#         echo "No container found for ai-service"
#     fi
#     exit 1
# else
#     echo "AI service container is running!"
#     # Display running container info
#     docker ps | grep ai-service
# fi

# # Check container health after a short delay
# CONTAINER_ID=$(docker ps | grep ai-service | awk '{print $1}')
# if [ -n "$CONTAINER_ID" ]; then
#     # Print recent logs
#     echo "Recent container logs:"
#     docker logs --tail 20 $CONTAINER_ID
    
#     # Check if container is still running
#     if [ $(docker ps | grep ai-service | wc -l) -eq 0 ]; then
#         echo "WARNING: Container started but has stopped. Check for errors."
#         exit 1
#     fi
    
#     # Monitor container for a bit to make sure it's stable
#     echo "Monitoring container for 30 seconds..."
#     for i in {1..3}; do
#         sleep 10
#         if [ $(docker ps | grep ai-service | wc -l) -eq 0 ]; then
#             echo "WARNING: Container stopped after running for a while. Check logs:"
#             docker logs $CONTAINER_ID
#             exit 1
#         fi
#         echo "Container still running after $((i*10)) seconds..."
#     done
# fi

# # Clean up
# echo "Removing temporary files..."
# rm docker-compose.override.yaml

# echo "Deployment completed successfully!"



#!/bin/bash
set -e

cd /home/opc/app

# Check if HF_TOKEN is set 
if [ -z "$HF_TOKEN" ]; then
    echo "Error: HF_TOKEN is not set!"
    exit 1
fi

# Check for GITHUB_SHA
if [ -n "$GITHUB_SHA" ]; then
    echo "Deploying specific version: $GITHUB_SHA"
    IMAGE_TAG="lorddickson/ai-service:${GITHUB_SHA}"
else
    echo "No specific version provided, using latest"
    IMAGE_TAG="lorddickson/ai-service:latest"
fi

# Force pull the specified image
echo "Pulling image: $IMAGE_TAG"
docker pull $IMAGE_TAG || {
    echo "Failed to pull $IMAGE_TAG, falling back to latest"
    IMAGE_TAG="lorddickson/ai-service:latest"
    docker pull $IMAGE_TAG || { 
        echo "Failed to pull latest image as well! Deployment failed."
        exit 1
    }
}

# AI Service .env
echo "Creating ai-service .env file..."
mkdir -p ai-service
cat > ai-service/.env << EOL
HF_TOKEN=$HF_TOKEN
MODEL_ENDPOINT=model_endpoint
PYTHONUNBUFFERED=1
TRANSFORMERS_CACHE=/root/.cache/huggingface
EOL
echo "Created ai-service .env file."


# Create production override to use the specific Docker image
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
    image: ${IMAGE_TAG}
    restart: always
    ports:
      - "50052:50052"
    environment:
      - PYTHONUNBUFFERED=1
      - TRANSFORMERS_CACHE=/root/.cache/huggingface
      - PYTHON_ENV=production
      - HF_TOKEN=$HF_TOKEN
    volumes:
      - ./ai-service/.env:/app/.env
      - ai-model-cache:/root/.cache/huggingface
    depends_on: []
    command: ["/opt/venv/bin/python", "/app/main.py"]
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('localhost', 50052)); s.close()"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

volumes:
  ai-model-cache:
EOL

# Stop and remove existing containers
echo "Stopping existing containers..."
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml down || true
docker rm -f $(docker ps -a -q --filter name=ai-service) 2>/dev/null || true

# Clean up any dangling/unused images to free up space
echo "Cleaning up unused Docker images..."
docker image prune -f

# Verify image details
echo "Image details for $IMAGE_TAG:"
docker inspect $IMAGE_TAG --format "Size: {{.Size}} bytes, Created: {{.Created}}, ID: {{.Id}}"

# Start the container with the specific image
echo "Starting AI service container using ${IMAGE_TAG}..."
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d ai-service

# Wait for container to start and verify it's running
echo "Waiting for container to start..."
sleep 5

CONTAINER_ID=$(docker ps -q --filter ancestor=$IMAGE_TAG)
if [ -z "$CONTAINER_ID" ]; then
    echo "ERROR: Container failed to start!"
    
    # Get container ID even if it stopped
    FAILED_CONTAINER=$(docker ps -a -q --filter ancestor=$IMAGE_TAG --latest)
    if [ -n "$FAILED_CONTAINER" ]; then
        echo "Container logs:"
        docker logs $FAILED_CONTAINER
    fi
    
    exit 1
fi

echo "Container started with ID: $CONTAINER_ID"

# Monitor the container for 30 seconds to ensure stability
echo "Monitoring container for 30 seconds..."
for i in {1..6}; do
    sleep 5
    if ! docker ps -q --filter id=$CONTAINER_ID | grep -q .; then
        echo "ERROR: Container stopped running after $((i*5)) seconds!"
        docker logs $CONTAINER_ID
        exit 1
    fi
    echo "Container still running after $((i*5)) seconds..."
done

# Cleanup
echo "Removing temporary files..."
rm docker-compose.override.yaml

echo "Deployment completed successfully!"
echo "Container is running with image: $IMAGE_TAG"
echo "Recent logs:"
docker logs --tail 10 $CONTAINER_ID