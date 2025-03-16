#!/bin/sh
set -e

# Display banner
echo "==========================================="
echo " API Server Starting"
echo " Build: $(date -r /app/api)"
echo "==========================================="

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
if [ ! -f "/app/cenphiio-service-account.json" ]; then
    echo "WARNING: Firebase service account file is missing!"
    # If FIREBASE_KEY_JSON is provided as an environment variable, create the file
    if [ ! -z "$FIREBASE_KEY_JSON" ]; then
        echo "Creating service account file from environment variable..."
        echo "$FIREBASE_KEY_JSON" > /app/cenphiio-service-account.json
        chmod 600 /app/cenphiio-service-account.json
        echo "Service account file created successfully"
    fi
else
    echo "Firebase service account file found"
    # Ensure proper permissions as root
    chmod 600 /app/cenphiio-service-account.json
fi

# Enhanced certificate verification and setup
echo "Verifying certificate configuration..."

# Check system certificates
if [ -f "/etc/ssl/certs/ca-certificates.crt" ]; then
    echo "CA certificates found at /etc/ssl/certs/ca-certificates.crt"
else
    echo "WARNING: CA certificates not found at the expected location!"
    # Try to reinstall certificates as root
    apk add --no-cache ca-certificates && update-ca-certificates
fi

# Ensure Google certificates are available and readable
if [ -f "/app/google_roots.pem" ]; then
    echo "Google root certificates found at /app/google_roots.pem"
    # As root, we can fix permissions
    chmod 644 /app/google_roots.pem
else
    echo "WARNING: Google root certificates not found in app directory, downloading now..."
    curl -sSL https://pki.goog/roots.pem -o /app/google_roots.pem
    chmod 644 /app/google_roots.pem
fi

# Set environment variables to explicitly point to certificate files
export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
export SSL_CERT_DIR=/etc/ssl/certs
export GOOGLE_APPLICATION_CREDENTIALS=/app/cenphiio-service-account.json

# Test connection with curl explicitly using the certificates
echo "Testing connection to Google API..."
if curl -sSL --head https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com > /dev/null 2>&1; then
    echo "Connection to Google API successful"
else
    echo "WARNING: Cannot connect to Google API. This may affect Firebase authentication."
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