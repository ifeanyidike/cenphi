#!/bin/bash

# ============================================================================
# Artifact Registry Setup for Cloud Run
# ============================================================================
# Creates Docker repositories for api-server and ai-service
# ============================================================================

set -e

PROJECT_ID="${1:-cenphi-ai}"
REGION="${2:-us-central1}"

echo "============================================================================"
echo "Creating Artifact Registry Repositories"
echo "============================================================================"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Set project
gcloud config set project $PROJECT_ID

echo "Step 1: Creating repository for api-server..."
if gcloud artifacts repositories describe cenphi-api-server-repo \
    --location=$REGION \
    --project=$PROJECT_ID &>/dev/null; then
    echo "✅ cenphi-api-server-repo already exists"
else
    gcloud artifacts repositories create cenphi-api-server-repo \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for API Server" \
        --project=$PROJECT_ID
    echo "✅ Created cenphi-api-server-repo"
fi

echo ""
echo "Step 2: Creating repository for ai-service..."
if gcloud artifacts repositories describe cenphi-ai-service-repo \
    --location=$REGION \
    --project=$PROJECT_ID &>/dev/null; then
    echo "✅ cenphi-ai-service-repo already exists"
else
    gcloud artifacts repositories create cenphi-ai-service-repo \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for AI Service" \
        --project=$PROJECT_ID
    echo "✅ Created cenphi-ai-service-repo"
fi

echo ""
echo "Step 3: Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

echo ""
echo "============================================================================"
echo "✅ Artifact Registry Setup Complete!"
echo "============================================================================"
echo ""
echo "Repositories created:"
echo "  📦 ${REGION}-docker.pkg.dev/${PROJECT_ID}/cenphi-api-server-repo"
echo "  📦 ${REGION}-docker.pkg.dev/${PROJECT_ID}/cenphi-ai-service-repo"
echo ""
echo "Ready to deploy! 🚀"
echo ""
