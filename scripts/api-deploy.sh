!/bin/bash
set -e

cd /home/opc/app


# Check if DB_USERNAME is set
if [ -z "$DB_USERNAME" ]; then
    echo "Error: HF_TOKEN is not set!"
    exit 1
fi

# Check if DB_PASSWORD is set
if [ -z "$DB_PASSWORD" ]; then
    echo "Error: DB_PASSWORD is not set!"
    exit 1

# Check if DB_HOST is set
if [ -z "$DB_HOST" ]; then
    echo "Error: DB_HOST is not set!"
    exit 1

# Check if DB_PORT is set
if [ -z "$DB_PORT" ]; then
    echo "Error: DB_PORT is not set!"
    exit 1

# Ensure .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# API Server .env
if [ ! -f "api-server/.env" ]; then
    echo "Creating api-server .env file..."
    mkdir -p api-server
    cat > api-server/.env << 'EOL'
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=postgres
AI_SERVICE_HOST=ai-service
AI_SERVICE_PORT=50052
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

  ai-service:
    profiles: ["disabled"]

  cenphidb:
    image: busybox
    command: ["tail", "-f", "/dev/null"]

  api-server:
    build: null
    image: lorddickson/api-server:latest
    restart: always
    volumes:
      # Remove development volume mounts
      - ~/.aws:/root/.aws:ro
    # Remove dependency on local PostgreSQL
    depends_on: []
    environment:
      - GO_ENV=production
EOL

# Pull the latest image from Docker Hub
docker pull lorddickson/api-server:latest

# Start the container using the pre-built image
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d api-server cenphidb

# Clean up
rm docker-compose.override.yaml

echo "Deployment completed successfully!"