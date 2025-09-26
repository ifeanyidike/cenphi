#!/bin/bash
# scripts/api-deploy.sh
set -e
set -x

# Ensure we have the correct image
IMAGE_TAG="lorddickson/api-server:${GITHUB_SHA}"
LATEST_TAG="lorddickson/api-server:latest"

echo "🚀 Deploying API server with image: $IMAGE_TAG"

# Environment variable validation
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
    echo "❌ Error: One or more database environment variables are not set!"
    echo "Required: DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT"
    exit 1
fi

if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PASSWORD" ] || [ -z "$REDIS_PORT" ]; then
    echo "❌ Error: One or more Redis environment variables are not set!"
    echo "Required: REDIS_HOST, REDIS_PASSWORD, REDIS_PORT"
    exit 1
fi

if [ -z "$OCI_BUCKET" ] || [ -z "$OCI_REGION" ] || [ -z "$OCI_PRIVATE_KEY_CONTENT" ] || [ -z "$OCI_FINGERPRINT" ] || [ -z "$OCI_NAMESPACE" ]; then
    echo "❌ Error: One or more OCI variables are not set!"
    echo "Required: OCI_BUCKET, OCI_REGION, OCI_PRIVATE_KEY_CONTENT, OCI_FINGERPRINT, OCI_NAMESPACE"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ] || [ -z "$ANTHROPIC_API_KEY" ] || [ -z "$ASSEMBLYAI_API_KEY" ]; then
    echo "❌ Error: One or more models are not set!"
    echo "Required: OPENAI_API_KEY, ANTHROPIC_API_KEY, ASSEMBLYAI_API_KEY"
    exit 1
fi

if [ -z "$LINKEDIN_CLIENT_ID" ] || [ -z "$LINKEDIN_CLIENT_SECRET" ] || [ -z "$GOOGLE_DRIVE_CLIENT_ID" ] || [ -z "$GOOGLE_DRIVE_CLIENT_SECRET" ]; then
    echo "❌ Error: One or more secret keys and ids are not set!"
    echo "Required: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET"
    exit 1
fi

if [ -z "$FIREBASE_KEY_JSON" ] || [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ Error: Firebase configuration is incomplete!"
    echo "Required: FIREBASE_KEY_JSON, FIREBASE_PROJECT_ID"
    exit 1
fi

# Change directory to where the Docker Compose files are located
cd /home/opc/app

# Create .env file from environment variables
if [ ! -f "api-server/.env" ]; then
    echo "📝 Creating api-server .env file..."
    mkdir -p api-server
fi

cat > api-server/.env << EOL
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=postgres
DB_SSL_MODE=require
REDIS_HOST=$REDIS_HOST
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_PORT=$REDIS_PORT
REDIS_DB=0
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
GO_ENV=production
SERVER_ADDRESS=:8081
OCI_PRIVATE_KEY_PATH=/app/oci-secrets/private_rsa
OPENAI_API_KEY=$OPENAI_API_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ASSEMBLYAI_API_KEY=$ASSEMBLYAI_API_KEY
LINKEDIN_CLIENT_ID=$LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET=$LINKEDIN_CLIENT_SECRET
LINKEDIN_SCOPES=openid profile email w_member_social
LINKEDIN_REDIRECT_URI=https://cenphiapiserver.duckdns.org/api/social/oauth/callback
GOOGLE_DRIVE_CLIENT_ID=$GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET=$GOOGLE_DRIVE_CLIENT_SECRET
GOOGLE_DRIVE_REDIRECT_URI=https://cenphiapiserver.duckdns.org/api/google/oauth/callback
GOOGLE_DRIVE_SCOPES=https://www.googleapis.com/auth/drive.readonly
BASE_URL=https://cenphi.io
OCI_BUCKET=$OCI_BUCKET
OCI_FINGERPRINT=$OCI_FINGERPRINT
OCI_NAMESPACE=$OCI_NAMESPACE
OCI_USER_OCID=$OCI_USER_OCID
STORAGE_UPLOAD_TIMEOUT=30m
OCI_UPLOAD_TIMEOUT=30m
STORAGE_MAX_UPLOAD_SIZE=524288000  # 500MB
OCI_REQUEST_TIMEOUT=10m
OCI_RETRY_ATTEMPTS=3
OCI_STORAGE_ENABLED=true
AI_SERVICE_ENDPOINT=ai-service-447971937908.us-central1.run.app:443
GRPC_USE_TLS=true
AI_SERVICE_MAX_RETRIES=5
BREVO_API_KEY=$BREVO_API_KEY
OCI_KEY=$OCI_KEY
OCI_SECRET=$OCI_SECRET
OCI_REGION=$OCI_REGION
EOL

echo "✅ Environment file created successfully"

# Create Firebase service account file
echo "🔐 Creating Firebase service account file..."
echo "$FIREBASE_KEY_JSON" > api-server/cenphiio-service-account.json
chmod 600 api-server/cenphiio-service-account.json
echo "✅ Firebase service account file created"

# Download Google's root certificates
echo "📜 Downloading Google root certificates..."
curl -sSL https://pki.goog/roots.pem -o api-server/google_roots.pem
chmod 644 api-server/google_roots.pem

# Create OCI secrets directory
mkdir -p /home/opc/app/oci-secrets

# Write OCI private key from GitHub secret
echo "$OCI_PRIVATE_KEY_CONTENT" > /home/opc/app/oci-secrets/private_rsa
chmod 600 /home/opc/app/oci-secrets/private_rsa

# Create docker-compose override for production
cat > docker-compose.override.yaml << EOFDC

services:
  api-server:
    image: ${IMAGE_TAG}
    restart: always
    ports:
      - "8081:8081"
    volumes:
      - ./oci-secrets:/app/oci-secrets:ro
      - ./api-server/.env:/app/.env
      - ./api-server/cenphiio-service-account.json:/app/cenphiio-service-account.json
      - ./api-server/google_roots.pem:/app/google_roots.pem
      - /etc/ssl/certs:/etc/ssl/certs:ro
    depends_on: []
    environment:
      - GO_ENV=production
      - OCI_PRIVATE_KEY_PATH=/app/oci-secrets/private_rsa
      - SERVER_ADDRESS=:8081
      - DB_USERNAME=$DB_USERNAME
      - DB_PASSWORD=$DB_PASSWORD
      - DB_HOST=$DB_HOST
      - DB_PORT=$DB_PORT
      - DB_NAME=postgres
      - REDIS_HOST=$REDIS_HOST
      - REDIS_PASSWORD=$REDIS_PASSWORD
      - REDIS_PORT=$REDIS_PORT
      - FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
      - OPENAI_API_KEY=$OPENAI_API_KEY
      - ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
      - ASSEMBLYAI_API_KEY=$ASSEMBLYAI_API_KEY
      - LINKEDIN_CLIENT_ID=$LINKEDIN_CLIENT_ID
      - LINKEDIN_CLIENT_SECRET=$LINKEDIN_CLIENT_SECRET
      - LINKEDIN_SCOPES=openid profile email w_member_social
      - LINKEDIN_REDIRECT_URI=https://cenphiapiserver.duckdns.org/api/social/oauth/callback
      - GOOGLE_DRIVE_CLIENT_ID=$GOOGLE_DRIVE_CLIENT_ID
      - GOOGLE_DRIVE_CLIENT_SECRET=$GOOGLE_DRIVE_CLIENT_SECRET
      - GOOGLE_DRIVE_REDIRECT_URI=https://cenphiapiserver.duckdns.org/api/google/oauth/callback
      - GOOGLE_DRIVE_SCOPES=https://www.googleapis.com/auth/drive.readonly
      - BASE_URL=https://cenphi.io
      - OCI_BUCKET=$OCI_BUCKET
      - OCI_FINGERPRINT=$OCI_FINGERPRINT
      - OCI_NAMESPACE=$OCI_NAMESPACE
      - OCI_USER_OCID=$OCI_USER_OCID
      - STORAGE_UPLOAD_TIMEOUT=30m
      - OCI_UPLOAD_TIMEOUT=30m
      - STORAGE_MAX_UPLOAD_SIZE=524288000  # 500MB
      - OCI_REQUEST_TIMEOUT=10m
      - OCI_RETRY_ATTEMPTS=3
      - OCI_STORAGE_ENABLED=true
      - AI_SERVICE_ENDPOINT=ai-service-447971937908.us-central1.run.app:443
      - GRPC_USE_TLS=true
      - AI_SERVICE_MAX_RETRIES=5
      - BREVO_API_KEY=$BREVO_API_KEY
      - OCI_KEY=$OCI_KEY
      - OCI_SECRET=$OCI_SECRET
      - OCI_REGION=$OCI_REGION


  # Disable unused services
  cenphidb:
    profiles: ["disabled"]

EOFDC

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml down api-server || true

# Clean up any old containers
echo "🧹 Cleaning up old containers..."
docker rm -f $(docker ps -a -q --filter name=api-server) 2>/dev/null || true

# Clean up old images to ensure fresh deployment
echo "🗑️ Cleaning up old images..."
docker rmi $LATEST_TAG || true

# Force pull the image with SHA tag
echo "📥 Pulling image: $IMAGE_TAG"
docker pull $IMAGE_TAG || {
    echo "⚠️ Failed to pull $IMAGE_TAG, falling back to latest"
    docker pull $LATEST_TAG
    IMAGE_TAG=$LATEST_TAG
}

# Verify the image details
IMAGE_ID=$(docker images ${IMAGE_TAG} --format "{{.ID}}")
IMAGE_CREATED=$(docker images ${IMAGE_TAG} --format "{{.CreatedAt}}")
echo "📦 Selected image: $IMAGE_TAG"
echo "📦 Image ID: $IMAGE_ID"
echo "📦 Image created: $IMAGE_CREATED"

# Start the service
echo "🚀 Starting API server..."
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d api-server

# Verify the container is running
sleep 3
CONTAINER_ID=$(docker ps -q -f name=api-server)
if [ -z "$CONTAINER_ID" ]; then
    echo "❌ API server container failed to start!"
    FAILED_CONTAINER=$(docker ps -a -q -f name=api-server)
    if [ -n "$FAILED_CONTAINER" ]; then
        echo "📋 Container logs for failed container:"
        docker logs $FAILED_CONTAINER
    fi
    exit 1
fi

# Verify container is using the correct image
CONTAINER_IMAGE=$(docker inspect --format='{{.Config.Image}}' $CONTAINER_ID)
echo "🔍 Container $CONTAINER_ID is running with image: $CONTAINER_IMAGE"

# Verify that critical files exist in the container
echo "🔍 Verifying critical files in container..."
docker exec $CONTAINER_ID ls -la /app/.env || echo "⚠️ .env not found"
docker exec $CONTAINER_ID ls -la /app/cenphiio-service-account.json || echo "⚠️ Firebase key not found"
docker exec $CONTAINER_ID ls -la /app/google_roots.pem || echo "⚠️ Google certs not found"

# Test Redis connectivity from container
echo "🔗 Testing Redis connectivity from container..."
docker exec $CONTAINER_ID nc -zv $REDIS_HOST $REDIS_PORT || echo "⚠️ Cannot reach Redis"

# Health check
echo "🩺 Performing health check..."
MAX_RETRIES=10
RETRY_COUNT=0
RETRY_DELAY=10

until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
  echo "🩺 Health check attempt $((RETRY_COUNT+1))..."
  # Use docker exec to check health from inside the container
  HEALTH_STATUS=$(docker exec $CONTAINER_ID wget -q -O - http://localhost:8081/api/health 2>/dev/null || echo "failed")
  
  if [[ "$HEALTH_STATUS" == *"\"status\":\"ok\""* ]] || [[ "$HEALTH_STATUS" == "200" ]]; then
    echo "✅ API server is healthy!"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "⏳ Health check returned: $HEALTH_STATUS, retrying in $RETRY_DELAY seconds..."
    
    # Check if container is still running
    if ! docker ps | grep -q api-server; then
      echo "❌ Container stopped during health check. Logs:"
      CONTAINER_ID=$(docker ps -a -q -f name=api-server)
      if [ -n "$CONTAINER_ID" ]; then
        docker logs $CONTAINER_ID
      fi
      exit 1
    fi
    
    # Show recent logs
    echo "📋 Recent container logs:"
    docker logs --tail 20 $CONTAINER_ID
    
    sleep $RETRY_DELAY
  fi
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo "❌ Health check failed after $MAX_RETRIES attempts. Container logs:"
  CONTAINER_ID=$(docker ps -a -q -f name=api-server)
  if [ -n "$CONTAINER_ID" ]; then
    docker logs $CONTAINER_ID
  fi
  exit 1
fi

echo "🎉 API server deployment completed successfully!"
set +x