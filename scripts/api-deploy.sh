# #!/bin/bash
# set -e

# # Enable command tracing for better debugging
# set -x

# # Ensure we have the correct image
# IMAGE_TAG="lorddickson/api-server:${GITHUB_SHA}"
# LATEST_TAG="lorddickson/api-server:latest"

# echo "Deploying API server with image: $IMAGE_TAG"

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

# # First, change directory to where the Docker Compose files are located
# cd /home/opc/app

# # Create .env file from environment variables if not provided externally
# if [ ! -f "api-server/.env" ]; then
#     echo "Creating api-server .env file..."
#     mkdir -p api-server
#     cat > api-server/.env << EOL
# DB_USERNAME=$DB_USERNAME
# DB_PASSWORD=$DB_PASSWORD
# DB_HOST=$DB_HOST
# DB_PORT=$DB_PORT
# DB_NAME=postgres
# REDIS_HOST=$REDIS_HOST
# REDIS_PASSWORD=$REDIS_PASSWORD
# REDIS_PORT=$REDIS_PORT
# AWS_KEY=$AWS_KEY
# AWS_REGION=$AWS_REGION
# AWS_SECRET=$AWS_SECRET
# AWS_BUCKET_NAME=$AWS_BUCKET_NAME
# FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
# GO_ENV=production
# SERVER_ADDRESS=:8081
# AI_SERVICE_HOST=ai-service
# AI_SERVICE_PORT=50052
# EOL
#     echo "Created api-server .env file."
    
#     # Create Firebase service account file if FIREBASE_KEY_JSON is provided
#     if [ -n "$FIREBASE_KEY_JSON" ]; then
#         echo "$FIREBASE_KEY_JSON" > api-server/cenphiio-service-account.json
#         echo "Created Firebase service account file."
#     fi
# fi

# # Create docker-compose override for production IN THE CORRECT DIRECTORY
# cat > docker-compose.override.yaml << EOFDC
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
#       - ./api-server/.env:/app/.env
#       - ./api-server/cenphiio-service-account.json:/app/cenphiio-service-account.json
#     depends_on: []
#     environment:
#       - GO_ENV=production
#       - SERVER_ADDRESS=:8081
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
# EOFDC

# # Stop any existing containers
# echo "Stopping existing containers..."
# docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml down api-server || true

# # Clean up any old containers with the same name
# echo "Removing any existing api-server containers..."
# docker rm -f $(docker ps -a -q --filter name=api-server) 2>/dev/null || true

# # Clean up any existing images to ensure we pull fresh ones
# echo "Cleaning up existing images..."
# docker rmi $IMAGE_TAG $LATEST_TAG || true

# # Force pull the image with SHA tag
# echo "Pulling image: $IMAGE_TAG"
# docker pull $IMAGE_TAG || {
#     echo "Failed to pull $IMAGE_TAG, falling back to latest"
#     docker pull $LATEST_TAG
#     IMAGE_TAG=$LATEST_TAG
# }

# # Verify the image details to confirm we have the correct image
# IMAGE_ID=$(docker images ${IMAGE_TAG} --format "{{.ID}}")
# IMAGE_CREATED=$(docker images ${IMAGE_TAG} --format "{{.CreatedAt}}")
# echo "Selected image: $IMAGE_TAG"
# echo "Image ID: $IMAGE_ID"
# echo "Image created: $IMAGE_CREATED"

# # Start the service
# echo "Starting API server..."
# docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d api-server

# # Verify the container is running with the correct image
# CONTAINER_ID=$(docker ps -q -f name=api-server)
# if [ -z "$CONTAINER_ID" ]; then
#     echo "ERROR: API server container failed to start!"
#     # Look for the container even if it's stopped
#     FAILED_CONTAINER=$(docker ps -a -q -f name=api-server)
#     if [ -n "$FAILED_CONTAINER" ]; then
#         echo "Container logs for failed container:"
#         docker logs $FAILED_CONTAINER
#     else
#         echo "No container found with name api-server"
#     fi
#     exit 1
# fi

# # Double-check the container is using the correct image
# CONTAINER_IMAGE=$(docker inspect --format='{{.Config.Image}}' $CONTAINER_ID)
# echo "Container $CONTAINER_ID is running with image: $CONTAINER_IMAGE"
# if [[ "$CONTAINER_IMAGE" != "$IMAGE_TAG" ]]; then
#     echo "WARNING: Container is not using the expected image!"
#     echo "Expected: $IMAGE_TAG"
#     echo "Actual: $CONTAINER_IMAGE"
# fi

# # Verify that critical files exist in the container
# echo "Verifying critical files in container..."
# docker exec $CONTAINER_ID ls -la /app/.env || echo "WARNING: .env not found in container!"
# docker exec $CONTAINER_ID ls -la /etc/ssl/certs/ca-certificates.crt || echo "WARNING: ca-certificates.crt not found in container!"

# # Health check
# echo "Performing health check..."
# MAX_RETRIES=10
# RETRY_COUNT=0
# RETRY_DELAY=10

# until [ $RETRY_COUNT -ge $MAX_RETRIES ]
# do
#   echo "Health check attempt $((RETRY_COUNT+1))..."
#   # Use docker exec to check health from inside the container to avoid network issues
#   HEALTH_STATUS=$(docker exec $CONTAINER_ID wget -q -O - http://localhost:8081/api/v1/health 2>/dev/null || echo "failed")
  
#   if [[ "$HEALTH_STATUS" == *"\"status\":\"ok\""* ]] || [[ "$HEALTH_STATUS" == "200" ]]; then
#     echo "API server is healthy!"
#     break
#   fi
  
#   RETRY_COUNT=$((RETRY_COUNT+1))
#   if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
#     echo "Health check returned: $HEALTH_STATUS, retrying in $RETRY_DELAY seconds..."
    
#     # Check if container is still running and get its logs
#     if ! docker ps | grep -q api-server; then
#       echo "ERROR: Container stopped during health check. Logs:"
#       CONTAINER_ID=$(docker ps -a -q -f name=api-server)
#       if [ -n "$CONTAINER_ID" ]; then
#         docker logs $CONTAINER_ID
#       else
#         echo "No container found with name api-server"
#       fi
#       exit 1
#     fi
    
#     # Show recent logs to help diagnose issues
#     echo "Recent container logs:"
#     docker logs --tail 20 $CONTAINER_ID
    
#     sleep $RETRY_DELAY
#   fi
# done

# if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
#   echo "Health check failed after $MAX_RETRIES attempts. Container logs:"
#   CONTAINER_ID=$(docker ps -a -q -f name=api-server)
#   if [ -n "$CONTAINER_ID" ]; then
#     docker logs $CONTAINER_ID
#   else
#     echo "No container found with name api-server"
#   fi
#   exit 1
# fi

# # Clean up override file (commented out for debugging, uncomment if desired)
# # rm docker-compose.override.yaml

# echo "API server deployment completed successfully!"
# set +x  # Disable command tracing

# scripts/api-deploy.sh

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

# Always create fresh Firebase service account file
echo "Creating Firebase service account file..."
mkdir -p api-server
echo "$FIREBASE_KEY_JSON" > api-server/cenphiio-service-account.json
chmod 600 api-server/cenphiio-service-account.json
echo "Created Firebase service account file."

# Download Google's root certificates to mount into container
echo "Downloading Google root certificates..."
curl -sSL https://pki.goog/roots.pem -o api-server/google_roots.pem
chmod 644 api-server/google_roots.pem

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
      - FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
      - SSL_CERT_FILE=/app/certs/cacert.pem
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

# Test certificate availability inside the container
echo "Testing certificate availability in container..."
docker exec $CONTAINER_ID ls -la /app/certs/
docker exec $CONTAINER_ID cat /app/certs/cacert.pem | head -n 5
docker exec $CONTAINER_ID cat /app/certs/google_roots.pem | head -n 5

# Verify that critical files exist in the container
echo "Verifying critical files in container..."
docker exec $CONTAINER_ID ls -la /app/.env || echo "WARNING: .env not found in container!"
docker exec $CONTAINER_ID ls -la /app/cenphiio-service-account.json || echo "WARNING: cenphiio-service-account.json not found in container!"
docker exec $CONTAINER_ID ls -la /app/google_roots.pem || echo "WARNING: google_roots.pem not found in container!"
docker exec $CONTAINER_ID ls -la /etc/ssl/certs/ca-certificates.crt || echo "WARNING: ca-certificates.crt not found in container!"

# Test Google API connectivity from inside the container
echo "Testing Google API connectivity from inside the container..."
docker exec $CONTAINER_ID curl --verbose --cacert /app/google_roots.pem https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com || echo "WARNING: Cannot connect to Google API using google_roots.pem"
docker exec $CONTAINER_ID curl --verbose --cacert /etc/ssl/certs/ca-certificates.crt https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com || echo "WARNING: Cannot connect to Google API using system certificates"

# Health check
echo "Performing health check..."
MAX_RETRIES=10
RETRY_COUNT=0
RETRY_DELAY=10

until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
  echo "Health check attempt $((RETRY_COUNT+1))..."
  # Use docker exec to check health from inside the container to avoid network issues
  HEALTH_STATUS=$(docker exec $CONTAINER_ID wget -q -O - http://localhost:8081/api/v1/health 2>/dev/null || echo "failed")
  
  if [[ "$HEALTH_STATUS" == *"\"status\":\"ok\""* ]] || [[ "$HEALTH_STATUS" == "200" ]]; then
    echo "API server is healthy!"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Health check returned: $HEALTH_STATUS, retrying in $RETRY_DELAY seconds..."
    
    # Check if container is still running and get its logs
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
    docker logs --tail 20 $CONTAINER_ID
    
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

echo "API server deployment completed successfully!"
set +x  # Disable command tracing