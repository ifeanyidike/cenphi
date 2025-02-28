# #!/bin/bash
# set -e

# cd /home/opc/app


# if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
#     echo "Error: One or more database environment variables are not set!"
#     echo "Required: DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT"
#     exit 1
# fi

# # API Server .env
# if [ ! -f "api-server/.env" ]; then
#     echo "Creating api-server .env file..."
#     mkdir -p api-server
#     cat > api-server/.env << EOL
#       DB_USERNAME=$DB_USERNAME
#       DB_PASSWORD=$DB_PASSWORD
#       DB_HOST=$DB_HOST
#       DB_PORT=$DB_PORT
#       DB_NAME=postgres
#       AI_SERVICE_HOST=ai-service
#       AI_SERVICE_PORT=50052
# EOL
#     echo "Created api-server .env file. Please update the values."
# fi

# # Stop existing containers
# docker compose -f docker-compose.prod.yaml down

# # Pull the latest image
# echo "Pulling the latest api-server image..."
# docker pull lorddickson/api-server:latest || { echo "Failed to pull image"; exit 1; }

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
#     image: lorddickson/api-server:latest
#     restart: always
#     volumes:
#       # Remove development volume mounts
#       - ~/.aws:/root/.aws:ro
#       - ./api-server/.env:/app/.env
#     # Remove dependency on local PostgreSQL
#     depends_on: []
#     environment:
#       - GO_ENV=production
#       - DB_USERNAME=$DB_USERNAME
#       - DB_PASSWORD=$DB_PASSWORD
#       - DB_HOST=$DB_HOST
#       - DB_PORT=$DB_PORT
#       - DB_NAME=postgres
#       - SERVER_ADDRESS=:8081
# EOL



# # Start the container using the pre-built image
# docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d api-server cenphidb

# sleep 5
# if [ $(docker ps | grep api-server | wc -l) -eq 0 ]; then
#     echo "ERROR: API server container failed to start. Check logs:"
#     docker logs $(docker ps -a | grep api-server | awk '{print $1}')
#     exit 1
# else
#     echo "API server container is running!"
#     # Display running container info
#     docker ps | grep api-server
# fi

# # Check container health after a short delay
# sleep 10
# API_CONTAINER_ID=$(docker ps | grep api-server | awk '{print $1}')
# if [ ! -z "$API_CONTAINER_ID" ]; then
#     # Print recent logs
#     echo "Recent API container logs:"
#     docker logs --tail 20 $API_CONTAINER_ID
    
#     # Check if container is still running
#     if [ $(docker ps | grep api-server | wc -l) -eq 0 ]; then
#         echo "WARNING: API container started but has stopped. Check for errors."
#         exit 1
#     fi
# fi

# # Clean up
# rm docker-compose.override.yaml

# echo "Deployment completed successfully!"

#!/bin/bash
set -e

cd /home/opc/app 

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

# API Server .env
echo "Creating api-server .env file..."
mkdir -p api-server
cat > api-server/.env << EOL
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
REDIS_HOST=$REDIS_HOST
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_PORT=$REDIS_PORT
AWS_KEY=$AWS_KEY
AWS_REGION=$AWS_REGION
AWS_SECRET=$AWS_SECRET
AWS_BUCKET_NAME=$AWS_BUCKET_NAME
DB_NAME=postgres
AI_SERVICE_HOST=ai-service
AI_SERVICE_PORT=50052
EOL
echo "Created api-server .env file."

# Stop existing containers
docker compose -f docker-compose.prod.yaml down

# Pull the latest image
echo "Pulling the latest api-server image..."
docker pull lorddickson/api-server:latest || { echo "Failed to pull image"; exit 1; }

# Create production override to use pre-built Docker images
cat > docker-compose.override.yaml << EOL
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
    image: lorddickson/api-server:latest
    restart: always
    volumes:
      # Mount the .env file directly to app root directory
      - ./api-server/.env:/app/.env
      - ~/.aws:/root/.aws:ro
    # Remove dependency on local PostgreSQL
    depends_on: []
    environment:
      - GO_ENV=production
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
      - SERVER_ADDRESS=:8081
EOL
  
# Start the container using the pre-built image
docker compose -f docker-compose.prod.yaml -f docker-compose.override.yaml up -d api-server cenphidb

# Wait for containers to stabilize
echo "Waiting for containers to start..."
sleep 10

# Check if API server is running
if [ $(docker ps | grep api-server | wc -l) -eq 0 ]; then
    echo "ERROR: API server container failed to start. Check logs:"
    docker logs $(docker ps -a | grep api-server | awk '{print $1}')
    exit 1
else
    echo "API server container is running!"
    # Display running container info
    docker ps | grep api-server
fi

# Print recent logs to verify everything is working
API_CONTAINER_ID=$(docker ps | grep api-server | awk '{print $1}')
if [ ! -z "$API_CONTAINER_ID" ]; then
    # Print recent logs
    echo "Recent API container logs:"
    # docker logs --tail 20 $API_CONTAINER_ID
    
    # Check if container is still running
    if [ $(docker ps | grep api-server | wc -l) -eq 0 ]; then
        echo "WARNING: API container started but has stopped. Check for errors."
        exit 1
    fi
fi

# Clean up
rm docker-compose.override.yaml

echo "Deployment completed successfully!"