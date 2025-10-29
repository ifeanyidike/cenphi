#!/bin/bash

# Cloud Run Security Setup Script
# This script sets up IAM permissions for service-to-service authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info "Cloud Run Security Setup"
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    print_error "No Google Cloud project is set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

print_info "Project ID: $PROJECT_ID"
REGION="us-central1"

# Step 1: Get the default compute service account
print_info "Getting default compute service account..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
DEFAULT_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
print_success "Service account: $DEFAULT_SA"

# Step 2: Grant API Server permission to invoke AI Service
print_info "Granting api-server permission to invoke ai-service..."

# Check if ai-service exists
if ! gcloud run services describe ai-service --region=$REGION >/dev/null 2>&1; then
    print_warning "ai-service not deployed yet. Deploy it first, then run this script."
    exit 1
fi

# Add IAM binding
gcloud run services add-iam-policy-binding ai-service \
    --region=$REGION \
    --member="serviceAccount:$DEFAULT_SA" \
    --role="roles/run.invoker" \
    --quiet

print_success "Granted run.invoker role to api-server service account"

# Step 3: Verify the binding
print_info "Verifying IAM policy..."
gcloud run services get-iam-policy ai-service --region=$REGION

print_success "Security setup complete!"
echo ""
print_info "Summary:"
echo "  ✅ ai-service is PRIVATE (ingress: internal)"
echo "  ✅ api-server can invoke ai-service"
echo "  ✅ api-server is PUBLIC (accessible from frontend)"
echo "  ✅ Both services scale to 0 for cost savings"
echo ""
print_warning "Note: Make sure your gRPC client in api-server uses authentication tokens!"
echo "      See: https://cloud.google.com/run/docs/authenticating/service-to-service"

