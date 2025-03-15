# #!/bin/bash
# set -e

# cd /home/opc/app

# # Environment variable validation
# if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
#     echo "Error: One or more database environment variables are not set!"
#     echo "Required: DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT"
#     exit 1
# fi

# if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PASSWORD" ] || [ -z "$REDIS_PORT" ]; then
#     echo "Error: One or more redis environment variables are not set!"
#     echo "Required: REDIS_HOST, REDIS_PASSWORD, REDIS_PORT"
#     exit 1
# fi

# if [ -z "$AWS_KEY" ] || [ -z "$AWS_REGION" ] || [ -z "$AWS_SECRET" ] || [ -z "$AWS_BUCKET_NAME" ]; then
#     echo "Error: One or more aws keys or secrets are not set!"
#     echo "Required: AWS_KEY, AWS_REGION, AWS_SECRET, AWS_BUCKET_NAME"
#     exit 1
# fi

# if [ -z "$FIREBASE_KEY_JSON" ] || [ -z "$FIREBASE_PROJECT_ID" ]; then
#     echo "Error: Firebase Key JSON or Firebase Project ID are not set!"
#     echo "Required: FIREBASE_KEY_JSON, FIREBASE_PROJECT_ID"
#     exit 1
# fi

# # Check for GITHUB_SHA
# if [ -n "$GITHUB_SHA" ]; then
#     echo "Deploying specific version: $GITHUB_SHA"
#     IMAGE_TAG="lorddickson/api-server:${GITHUB_SHA}"
#     # Try to pull the specific SHA-tagged image
#     docker pull $IMAGE_TAG || {
#         echo "Image with SHA tag not found, falling back to latest"
#         IMAGE_TAG="lorddickson/api-server:latest"
#     }
# else
#     echo "No specific version provided, using latest"
#     IMAGE_TAG="lorddickson/api-server:latest"
# fi

# # API Server .env
# echo "Creating api-server .env file..."
# mkdir -p api-server
# cat > api-server/.env << EOL
# DB_USERNAME=$DB_USERNAME
# DB_PASSWORD=$DB_PASSWORD
# DB_HOST=$DB_HOST
# DB_PORT=$DB_PORT
# REDIS_HOST=$REDIS_HOST
# REDIS_PASSWORD=$REDIS_PASSWORD
# REDIS_PORT=$REDIS_PORT
# AWS_KEY=$AWS_KEY
# AWS_REGION=$AWS_REGION
# AWS_SECRET=$AWS_SECRET
# AWS_BUCKET_NAME=$AWS_BUCKET_NAME
# FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
# DB_NAME=postgres
# AI_SERVICE_HOST=ai-service
# AI_SERVICE_PORT=50052
# EOL
# echo "Created api-server .env file."

# echo "$FIREBASE_KEY_JSON" > api-server/cenphiio-service-account.json

# # Stop existing containers
# echo "Stopping existing containers..."
# docker compose -f docker-compose.prod.yaml down || true

# # Remove any existing containers with the same name
# echo "Removing any existing api-server containers..."
# docker rm -f $(docker ps -a -q --filter name=api-server) 2>/dev/null || true

# # Clear Docker cache for the specific image
# echo "Clearing Docker cache for api-server image..."
# docker rmi lorddickson/api-server:latest 2>/dev/null || true
# if [ -n "$GITHUB_SHA" ]; then
#     docker rmi lorddickson/api-server:${GITHUB_SHA} 2>/dev/null || true
# fi

# # Pull the latest image
# echo "Pulling the image: $IMAGE_TAG..."
# docker pull $IMAGE_TAG || { echo "Failed to pull image $IMAGE_TAG"; exit 1; }

# # Create production override to use pre-built Docker images
# cat > docker-compose.override.yaml << EOL
# services:
#   # Disable services that are not needed in production
#   frontend:
#     profiles: ["disabled"]
    
#   ai-service:
#     profiles: ["disabled"]
    
#   cenphidb:
#     image: busybox
#     command: ["tail", "-f", "/dev/null"]
    
#   api-server:
#     image: ${IMAGE_TAG}
#     restart: always
#     ports:
#       - "8081:8081"
#     volumes:
#       # Mount only configuration files, not code
#       - ./api-server/.env:/app/.env
#       - ./api-server/cenphiio-service-account.json:/app/cenphiio-service-account.json
#       - ~/.aws:/root/.aws:ro
#       - /etc/ssl/certs:/etc/ssl/certs:ro
#     # Remove dependency on local PostgreSQL
#     depends_on: []
#     environment:
#       - GO_ENV=production
#       - DB_USERNAME=$DB_USERNAME
#       - DB_PASSWORD=$DB_PASSWORD
#       - DB_HOST=$DB_HOST
#       - DB_PORT=$DB_PORT
#       - REDIS_HOST=$REDIS_HOST
#       - REDIS_PASSWORD=$REDIS_PASSWORD
#       - REDIS_PORT=$REDIS_PORT
#       - AWS_KEY=$AWS_KEY
#       - AWS_REGION=$AWS_REGION
#       - AWS_SECRET=$AWS_SECRET
#       - AWS_BUCKET_NAME=$AWS_BUCKET_NAME
#       - DB_NAME=postgres
#       - SERVER_ADDRESS=:8081
# EOL

# # Verify image details
# IMAGE_SIZE=$(docker images ${IMAGE_TAG} --format "{{.Size}}")
# IMAGE_ID=$(docker images ${IMAGE_TAG} --format "{{.ID}}")
# IMAGE_CREATED=$(docker images ${IMAGE_TAG} --format "{{.CreatedAt}}")
# echo "Selected image: $IMAGE_TAG"
# echo "Image ID: $IMAGE_ID"
# echo "Image size: $IMAGE_SIZE"
# echo "Image created: $IMAGE_CREATED"

# # Start the container using the pre-built image
# echo "Starting containers..."
# docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d api-server cenphidb

# # Wait for containers to stabilize
# echo "Waiting for containers to start..."
# sleep 10

# # Check if API server is running
# if [ $(docker ps | grep api-server | wc -l) -eq 0 ]; then
#     echo "ERROR: API server container failed to start. Check logs:"
#     # Get the container ID even if it's not running
#     CONTAINER_ID=$(docker ps -a | grep api-server | awk '{print $1}')
#     if [ -n "$CONTAINER_ID" ]; then
#         docker logs $CONTAINER_ID
#     else
#         echo "No container found for api-server"
#     fi
#     exit 1
# else
#     echo "API server container is running!"
#     # Display running container info
#     docker ps | grep api-server
# fi

# # Verify that critical files exist in the container
# echo "Verifying critical files in container..."
# CONTAINER_ID=$(docker ps -q -f name=api-server)
# docker exec $CONTAINER_ID ls -la /app/google_roots.pem || echo "WARNING: google_roots.pem not found in container!"
# docker exec $CONTAINER_ID ls -la /etc/ssl/certs/ca-certificates.crt || echo "WARNING: ca-certificates.crt not found in container!"

# # Print recent logs to verify everything is working
# API_CONTAINER_ID=$(docker ps | grep api-server | awk '{print $1}')
# if [ -n "$API_CONTAINER_ID" ]; then
#     # Print recent logs
#     echo "Recent API container logs:"
#     docker logs --tail 20 $API_CONTAINER_ID
    
#     # Check if container is still running
#     if [ $(docker ps | grep api-server | wc -l) -eq 0 ]; then
#         echo "WARNING: API container started but has stopped. Check for errors."
#         exit 1
#     fi
    
#     # Monitor container for a bit to make sure it's stable
#     echo "Monitoring container for 30 seconds..."
#     for i in {1..3}; do
#         sleep 10
#         if [ $(docker ps | grep api-server | wc -l) -eq 0 ]; then
#             echo "WARNING: Container stopped after running for a while. Check logs:"
#             docker logs $API_CONTAINER_ID
#             exit 1
#         fi
#         echo "Container still running after $((i*10)) seconds..."
#     done
# fi

# # Perform API health check
# echo "Performing API health check..."
# MAX_RETRIES=5
# RETRY_COUNT=0

# until [ $RETRY_COUNT -ge $MAX_RETRIES ]
# do
#   HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/v1/health || echo "failed")

#   if [ "$HEALTH_STATUS" = "200" ]; then
#     echo "API is healthy!"
#     break
#   fi

#   RETRY_COUNT=$((RETRY_COUNT+1))
#   echo "Health check attempt $RETRY_COUNT failed (status: $HEALTH_STATUS), retrying in 10 seconds..."
#   sleep 10
# done

# if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
#   echo "API health check failed after $MAX_RETRIES attempts. Container logs:"
#   docker logs $API_CONTAINER_ID
#   exit 1
# fi

# # Clean up
# echo "Removing temporary files..."
# rm docker-compose.override.yaml

# echo "Deployment completed successfully!"


#!/bin/bash
set -e

# Enable command tracing for better debugging
set -x

# Ensure we have the correct image
IMAGE_TAG="lorddickson/api-server:${GITHUB_SHA}"
LATEST_TAG="lorddickson/api-server:latest"

echo "Deploying API server with image: $IMAGE_TAG"

# Environment variable validation
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
    echo "Error: One or more database environment variables are not set!"
    echo "Required: DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT"
    exit 1
fi

if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PASSWORD" ] || [ -z "$REDIS_PORT" ]; then
    echo "Error: One or more redis environment variables are not set!"
    echo "Required: REDIS_HOST, REDIS_PASSWORD, REDIS_PORT"
    exit 1
fi

if [ -z "$AWS_KEY" ] || [ -z "$AWS_REGION" ] || [ -z "$AWS_SECRET" ] || [ -z "$AWS_BUCKET_NAME" ]; then
    echo "Error: One or more aws keys or secrets are not set!"
    echo "Required: AWS_KEY, AWS_REGION, AWS_SECRET, AWS_BUCKET_NAME"
    exit 1
fi

if [ -z "$FIREBASE_KEY_JSON" ] || [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "Error: Firebase Key JSON or Firebase Project ID are not set!"
    echo "Required: FIREBASE_KEY_JSON, FIREBASE_PROJECT_ID"
    exit 1
fi

# First, change directory to where the Docker Compose files are located
cd /home/opc/app

# Create .env file from environment variables if not provided externally
if [ ! -f "api-server/.env" ]; then
    echo "Creating api-server .env file..."
    mkdir -p api-server
    cat > api-server/.env << EOL
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=postgres
REDIS_HOST=$REDIS_HOST
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_PORT=$REDIS_PORT
AWS_KEY=$AWS_KEY
AWS_REGION=$AWS_REGION
AWS_SECRET=$AWS_SECRET
AWS_BUCKET_NAME=$AWS_BUCKET_NAME
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
GO_ENV=production
SERVER_ADDRESS=:8081
AI_SERVICE_HOST=ai-service
AI_SERVICE_PORT=50052
EOL
    echo "Created api-server .env file."
    
    # Create Firebase service account file if FIREBASE_KEY_JSON is provided
    if [ -n "$FIREBASE_KEY_JSON" ]; then
        echo "$FIREBASE_KEY_JSON" > api-server/cenphiio-service-account.json
        echo "Created Firebase service account file."
    fi
fi

# Create docker-compose override for production IN THE CORRECT DIRECTORY
cat > docker-compose.override.yaml << EOFDC
services:
  # Disable services that are not needed in production
  frontend:
    profiles: ["disabled"]
      
  ai-service:
    profiles: ["disabled"]
      
  cenphidb:
    image: busybox
    command: ["tail", "-f", "/dev/null"]
      
  api-server:
    image: ${IMAGE_TAG}
    restart: always
    ports:
      - "8081:8081"
    volumes:
      - ./api-server/.env:/app/.env
      - ./api-server/cenphiio-service-account.json:/app/cenphiio-service-account.json
      - /etc/ssl/certs:/etc/ssl/certs:ro
      - /etc/ca-certificates:/etc/ca-certificates:ro
    depends_on: []
    environment:
      - GO_ENV=production
      - SERVER_ADDRESS=:8081
      - DB_USERNAME=$DB_USERNAME
      - DB_PASSWORD=$DB_PASSWORD
      - DB_HOST=$DB_HOST
      - DB_PORT=$DB_PORT
      - REDIS_HOST=$REDIS_HOST
      - REDIS_PASSWORD=$REDIS_PASSWORD
      - REDIS_PORT=$REDIS_PORT
      - AWS_KEY=$AWS_KEY
      - AWS_REGION=$AWS_REGION
      - AWS_SECRET=$AWS_SECRET
      - AWS_BUCKET_NAME=$AWS_BUCKET_NAME
      - DB_NAME=postgres
EOFDC

# Stop any existing containers
echo "Stopping existing containers..."
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml down api-server || true

# Clean up any old containers with the same name
echo "Removing any existing api-server containers..."
docker rm -f $(docker ps -a -q --filter name=api-server) 2>/dev/null || true

# Clean up any existing images to ensure we pull fresh ones
echo "Cleaning up existing images..."
docker rmi $IMAGE_TAG $LATEST_TAG || true

# Force pull the image with SHA tag
echo "Pulling image: $IMAGE_TAG"
docker pull $IMAGE_TAG || {
    echo "Failed to pull $IMAGE_TAG, falling back to latest"
    docker pull $LATEST_TAG
    IMAGE_TAG=$LATEST_TAG
}

# Verify the image details to confirm we have the correct image
IMAGE_ID=$(docker images ${IMAGE_TAG} --format "{{.ID}}")
IMAGE_CREATED=$(docker images ${IMAGE_TAG} --format "{{.CreatedAt}}")
echo "Selected image: $IMAGE_TAG"
echo "Image ID: $IMAGE_ID"
echo "Image created: $IMAGE_CREATED"

# Start the service
echo "Starting API server..."
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d api-server

# Verify the container is running with the correct image
CONTAINER_ID=$(docker ps -q -f name=api-server)
if [ -z "$CONTAINER_ID" ]; then
    echo "ERROR: API server container failed to start!"
    # Look for the container even if it's stopped
    FAILED_CONTAINER=$(docker ps -a -q -f name=api-server)
    if [ -n "$FAILED_CONTAINER" ]; then
        echo "Container logs for failed container:"
        docker logs $FAILED_CONTAINER
    else
        echo "No container found with name api-server"
    fi
    exit 1
fi

# Double-check the container is using the correct image
CONTAINER_IMAGE=$(docker inspect --format='{{.Config.Image}}' $CONTAINER_ID)
echo "Container $CONTAINER_ID is running with image: $CONTAINER_IMAGE"
if [[ "$CONTAINER_IMAGE" != "$IMAGE_TAG" ]]; then
    echo "WARNING: Container is not using the expected image!"
    echo "Expected: $IMAGE_TAG"
    echo "Actual: $CONTAINER_IMAGE"
fi

# Verify that critical files exist in the container
echo "Verifying critical files in container..."
docker exec $CONTAINER_ID ls -la /app/.env || echo "WARNING: .env not found in container!"
docker exec $CONTAINER_ID ls -la /etc/ssl/certs/ca-certificates.crt || echo "WARNING: ca-certificates.crt not found in container!"

# Health check
echo "Performing health check..."
MAX_RETRIES=10
RETRY_COUNT=0
RETRY_DELAY=10

until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
  echo "Health check attempt $((RETRY_COUNT+1))..."
  HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/v1/health || echo "failed")
  
  if [ "$HEALTH_STATUS" = "200" ]; then
    echo "API server is healthy!"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Health check returned status: $HEALTH_STATUS, retrying in $RETRY_DELAY seconds..."
    
    # Check if container is still running
    if ! docker ps | grep -q api-server; then
      echo "ERROR: Container stopped during health check. Logs:"
      CONTAINER_ID=$(docker ps -a -q -f name=api-server)
      if [ -n "$CONTAINER_ID" ]; then
        docker logs $CONTAINER_ID
      else
        echo "No container found with name api-server"
      fi
      exit 1
    fi
    
    # Show recent logs to help diagnose issues
    echo "Recent container logs:"
    CONTAINER_ID=$(docker ps -a -q -f name=api-server)
    if [ -n "$CONTAINER_ID" ]; then
      docker logs --tail 20 $CONTAINER_ID
    else
      echo "No container found with name api-server"
    fi
    
    sleep $RETRY_DELAY
  fi
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo "Health check failed after $MAX_RETRIES attempts. Container logs:"
  CONTAINER_ID=$(docker ps -a -q -f name=api-server)
  if [ -n "$CONTAINER_ID" ]; then
    docker logs $CONTAINER_ID
  else
    echo "No container found with name api-server"
  fi
  exit 1
fi

# Clean up override file (commented out for debugging, uncomment if desired)
# rm docker-compose.override.yaml

echo "API server deployment completed successfully!"
set +x  # Disable command tracing