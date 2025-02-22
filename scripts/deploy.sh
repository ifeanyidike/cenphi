#!/bin/bash
# scripts/deploy.sh

set -e

# Load environment variables
source .env.prod

# Pull latest changes
git pull origin main

# Build and deploy services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f