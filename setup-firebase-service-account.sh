#!/bin/bash

# ============================================================================
# Firebase Service Account Setup for Cloud Run (ADC)
# ============================================================================
# This script creates a service account for api-server with Firebase Admin
# permissions, enabling Application Default Credentials (ADC).
#
# Usage:
#   ./setup-firebase-service-account.sh [PROJECT_ID] [REGION]
#
# Example:
#   ./setup-firebase-service-account.sh cenphi-ai us-central1
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_PROJECT_ID="cenphi-ai"
DEFAULT_REGION="us-central1"

# Parse arguments
PROJECT_ID="${1:-$DEFAULT_PROJECT_ID}"
REGION="${2:-$DEFAULT_REGION}"
SERVICE_ACCOUNT_NAME="api-server-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Firebase Service Account Setup for Cloud Run${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Project ID:${NC} $PROJECT_ID"
echo -e "${YELLOW}Region:${NC} $REGION"
echo -e "${YELLOW}Service Account:${NC} $SERVICE_ACCOUNT_EMAIL"
echo ""

# Confirm with user
read -p "Continue with these settings? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Checking if service account exists...${NC}"

# Check if service account already exists
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --project=$PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}⚠️  Service account already exists: $SERVICE_ACCOUNT_EMAIL${NC}"
else
    echo -e "${GREEN}Creating service account...${NC}"
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="API Server Service Account" \
        --description="Service account for api-server on Cloud Run with Firebase Admin access" \
        --project=$PROJECT_ID

    echo -e "${GREEN}✅ Service account created successfully${NC}"
    echo -e "${YELLOW}⏳ Waiting 10 seconds for IAM propagation...${NC}"
    sleep 10
fi

echo ""
echo -e "${BLUE}Step 2: Granting Firebase Admin permissions...${NC}"

# Grant Firebase Admin role
echo -e "${GREEN}Granting roles/firebase.admin...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/firebase.admin" \
    --condition=None \
    --quiet

# Grant Service Account Token Creator (needed for ID token generation)
echo -e "${GREEN}Granting roles/iam.serviceAccountTokenCreator...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --condition=None \
    --quiet

echo -e "${GREEN}✅ Firebase permissions granted${NC}"

echo ""
echo -e "${BLUE}Step 3: Checking if ai-service exists for invoker permission...${NC}"

# Check if ai-service exists, grant invoker permission if it does
if gcloud run services describe ai-service --region=$REGION --project=$PROJECT_ID &>/dev/null; then
    echo -e "${GREEN}ai-service found. Granting invoker permission...${NC}"
    gcloud run services add-iam-policy-binding ai-service \
        --region=$REGION \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/run.invoker" \
        --project=$PROJECT_ID

    echo -e "${GREEN}✅ Permission to invoke ai-service granted${NC}"
else
    echo -e "${YELLOW}⚠️  ai-service not found (not yet deployed)${NC}"
    echo -e "${YELLOW}   You'll need to grant invoker permission after ai-service is deployed:${NC}"
    echo -e "${YELLOW}   gcloud run services add-iam-policy-binding ai-service \\${NC}"
    echo -e "${YELLOW}       --region=$REGION \\${NC}"
    echo -e "${YELLOW}       --member=\"serviceAccount:$SERVICE_ACCOUNT_EMAIL\" \\${NC}"
    echo -e "${YELLOW}       --role=\"roles/run.invoker\"${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Verifying permissions...${NC}"

# Verify IAM policy
echo -e "${GREEN}Current IAM roles for service account:${NC}"
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" \
    --format="table(bindings.role)"

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}✅ Service Account Setup Complete!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Service Account Details:${NC}"
echo -e "  Email: ${BLUE}$SERVICE_ACCOUNT_EMAIL${NC}"
echo ""
echo -e "${YELLOW}Granted Roles:${NC}"
echo -e "  ✅ roles/firebase.admin"
echo -e "  ✅ roles/iam.serviceAccountTokenCreator"
if gcloud run services describe ai-service --region=$REGION --project=$PROJECT_ID &>/dev/null; then
    echo -e "  ✅ roles/run.invoker (for ai-service)"
fi
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Verify ${BLUE}api-server/cloudrun-service.yaml${NC} has this service account:"
echo -e "     ${GREEN}serviceAccountName: $SERVICE_ACCOUNT_EMAIL${NC}"
echo ""
echo -e "  2. Deploy api-server:"
echo -e "     ${GREEN}cd api-server && make deploy${NC}"
echo ""
echo -e "  3. Test Firebase authentication:"
echo -e "     ${GREEN}curl -H \"Authorization: Bearer <FIREBASE_TOKEN>\" \\${NC}"
echo -e "     ${GREEN}     https://api-server-xxx-uc.a.run.app/api/v1/testimonials${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo -e "  📖 See ${BLUE}api-server/FIREBASE_ADC_SETUP.md${NC} for detailed guide"
echo ""
echo -e "${GREEN}Setup complete! 🎉${NC}"
