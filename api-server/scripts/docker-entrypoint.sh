#!/bin/sh
set -e

# Display banner
echo "==========================================="
echo " API Server Starting"
echo " Build: $(date -r /app/api)"
echo "==========================================="

# Log the environment variables (redacted for security)
echo "Environment Overview:"
echo "- DB_HOST: ${DB_HOST:-not set}"
echo "- REDIS_HOST: ${REDIS_HOST:-not set}"
echo "- AWS_REGION: ${AWS_REGION:-not set}"
echo "- GO_ENV: ${GO_ENV:-production}"
echo "- SERVER_ADDRESS: ${SERVER_ADDRESS:-:8081}"

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
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
GO_ENV=${GO_ENV:-production}
SERVER_ADDRESS=${SERVER_ADDRESS:-:8081}
EOL
    echo "Created .env file successfully"
fi

# Verify critical files exist
echo "Verifying critical files..."

# Check service account file
if [ ! -f "/app/cenphiio-service-account.json" ]; then
    echo "WARNING: Firebase service account file is missing!"
    if [ ! -z "$FIREBASE_KEY_JSON" ]; then
        echo "Creating service account file from environment variable..."
        echo "$FIREBASE_KEY_JSON" > /app/cenphiio-service-account.json
        echo "Service account file created successfully"
    fi
else
    echo "Firebase service account file found"
fi

# Display certificate configuration
echo "Certificate configuration:"
echo "- SSL_CERT_FILE: ${SSL_CERT_FILE}"
echo "- GOOGLE_APPLICATION_CREDENTIALS: ${GOOGLE_APPLICATION_CREDENTIALS}"

# Verify our custom certificate files
if [ -f "/app/certs/cacert.pem" ]; then
    echo "CA certificate bundle found at /app/certs/cacert.pem"
else
    echo "WARNING: CA certificate bundle not found! Downloading now..."
    mkdir -p /app/certs
    curl --insecure -sSL https://curl.se/ca/cacert.pem -o /app/certs/cacert.pem || echo "Failed to download CA cert bundle"
fi

if [ -f "/app/certs/google_roots.pem" ]; then
    echo "Google root certificates found at /app/certs/google_roots.pem"
else
    echo "WARNING: Google root certificates not found! Downloading now..."
    mkdir -p /app/certs
    curl --insecure -sSL https://pki.goog/roots.pem -o /app/certs/google_roots.pem || echo "Failed to download Google roots"
fi

# Test connection with a more detailed approach
echo "Testing connection to Google API..."
echo "Using insecure connection first to verify network:"
if curl --insecure -sSL --head https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com > /dev/null 2>&1; then
    echo "Network connection to Google API works (insecure)"
    echo "Now testing with our certificate bundle:"
    if curl --cacert /app/certs/cacert.pem -sSL --head https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com > /dev/null 2>&1; then
        echo "Connection to Google API successful with our certificate bundle"
    else
        echo "WARNING: Certificate verification failed with our bundle"
    fi
else
    echo "WARNING: Cannot connect to Google API even with insecure flag. Network may be blocked."
    echo "Network diagnostics:"
    ping -c 1 www.googleapis.com || echo "Cannot ping googleapis.com"
    echo "DNS resolution:"
    nslookup www.googleapis.com || echo "Cannot resolve googleapis.com"
fi

# Print environment info
echo "Environment: ${GO_ENV:-production}"
echo "Server will listen on: ${SERVER_ADDRESS:-:8081}"

# Execute the main command
echo "Starting application..."
exec "$@"