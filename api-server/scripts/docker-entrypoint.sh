#!/bin/sh
set -e

# Check if .env file exists, if not create from environment variables
if [ ! -f "/app/.env" ] && [ ! -z "$DB_USERNAME" ]; then
    echo "Creating .env file from environment variables..."
    cat > /app/.env << EOL
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
DB_NAME=${DB_NAME:-postgres}
AI_SERVICE_HOST=${AI_SERVICE_HOST:-ai-service}
AI_SERVICE_PORT=${AI_SERVICE_PORT:-50052}
EOL
fi

# Execute the main command
exec "$@"