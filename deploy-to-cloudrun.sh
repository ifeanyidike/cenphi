#!/bin/bash

# Cloud Run Deployment Script for Cenphi
# This script helps deploy both api-server and ai-service to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command_exists gcloud; then
        print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install it from https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Setup Google Cloud project
setup_gcloud() {
    print_info "Setting up Google Cloud..."
    
    # Get current project
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    
    if [ -z "$CURRENT_PROJECT" ]; then
        print_warning "No Google Cloud project is set"
        read -p "Enter your Google Cloud Project ID: " PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    else
        print_info "Current project: $CURRENT_PROJECT"
        read -p "Do you want to use this project? (y/n): " use_current
        if [ "$use_current" != "y" ]; then
            read -p "Enter your Google Cloud Project ID: " PROJECT_ID
            gcloud config set project "$PROJECT_ID"
        fi
    fi
    
    print_success "Google Cloud project configured"
}

# Enable required APIs
enable_apis() {
    print_info "Enabling required Google Cloud APIs..."
    
    gcloud services enable run.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    print_success "Required APIs enabled"
}

# Create artifact registries
create_registries() {
    print_info "Creating Artifact Registry repositories..."
    
    # Create ai-service repository
    if gcloud artifacts repositories describe cenphi-ai-service-repo --location=us-central1 >/dev/null 2>&1; then
        print_warning "AI Service repository already exists"
    else
        gcloud artifacts repositories create cenphi-ai-service-repo \
            --repository-format=docker \
            --location=us-central1 \
            --description="Docker repository for Cenphi AI Service"
        print_success "AI Service repository created"
    fi
    
    # Create api-server repository
    if gcloud artifacts repositories describe cenphi-api-server-repo --location=us-central1 >/dev/null 2>&1; then
        print_warning "API Server repository already exists"
    else
        gcloud artifacts repositories create cenphi-api-server-repo \
            --repository-format=docker \
            --location=us-central1 \
            --description="Docker repository for Cenphi API Server"
        print_success "API Server repository created"
    fi
}

# Configure Docker for Artifact Registry
configure_docker() {
    print_info "Configuring Docker for Artifact Registry..."
    gcloud auth configure-docker us-central1-docker.pkg.dev
    print_success "Docker configured"
}

# Deploy AI Service
deploy_ai_service() {
    print_info "Deploying AI Service..."
    
    cd ai-service
    
    # Check if YAML file has been updated
    if grep -q "YOUR_PROJECT_ID" cloudrun-service-updated.yaml 2>/dev/null; then
        print_error "Please update cloudrun-service-updated.yaml with your actual values"
        print_warning "Run: vim cloudrun-service-updated.yaml"
        exit 1
    fi
    
    if grep -q "YOUR_REDIS_HOST" cloudrun-service-updated.yaml 2>/dev/null; then
        print_error "Please update Redis credentials in cloudrun-service-updated.yaml"
        exit 1
    fi
    
    # Deploy
    make deploy
    
    # Get service URL
    AI_SERVICE_URL=$(gcloud run services describe ai-service --region=us-central1 --format="value(status.url)")
    print_success "AI Service deployed successfully!"
    print_info "AI Service URL: $AI_SERVICE_URL"
    echo "$AI_SERVICE_URL" > ../ai-service-url.txt
    
    cd ..
}

# Deploy API Server
deploy_api_server() {
    print_info "Deploying API Server..."
    
    cd api-server
    
    # Check if YAML file has been updated
    if grep -q "YOUR_PROJECT_ID" cloudrun-service.yaml 2>/dev/null; then
        print_error "Please update cloudrun-service.yaml with your actual values"
        print_warning "Run: vim cloudrun-service.yaml"
        exit 1
    fi
    
    if grep -q "YOUR_DB_HOST" cloudrun-service.yaml 2>/dev/null; then
        print_error "Please update database credentials in cloudrun-service.yaml"
        exit 1
    fi
    
    # Check if AI service URL is set
    if [ -f ../ai-service-url.txt ]; then
        AI_SERVICE_URL=$(cat ../ai-service-url.txt)
        print_info "Using AI Service URL: $AI_SERVICE_URL"
        
        # Update the YAML file with AI service URL
        if command_exists sed; then
            sed -i.bak "s|AI_SERVICE_HOST.*|AI_SERVICE_HOST\n          value: \"$AI_SERVICE_URL\"|" cloudrun-service.yaml
        fi
    else
        print_warning "AI Service URL not found. Please update AI_SERVICE_HOST manually in cloudrun-service.yaml"
        read -p "Enter AI Service URL: " AI_SERVICE_URL
    fi
    
    # Deploy
    make deploy
    
    # Get service URL
    API_SERVER_URL=$(gcloud run services describe api-server --region=us-central1 --format="value(status.url)")
    print_success "API Server deployed successfully!"
    print_info "API Server URL: $API_SERVER_URL"
    echo "$API_SERVER_URL" > ../api-server-url.txt
    
    cd ..
}

# Main menu
show_menu() {
    echo ""
    echo "=================================="
    echo "  Cenphi Cloud Run Deployment"
    echo "=================================="
    echo "1. Setup (Enable APIs & Create Registries)"
    echo "2. Deploy AI Service Only"
    echo "3. Deploy API Server Only"
    echo "4. Deploy Both Services"
    echo "5. View Service Status"
    echo "6. Exit"
    echo ""
}

# Main script
main() {
    clear
    print_success "Cenphi Cloud Run Deployment Script"
    echo ""
    
    check_prerequisites
    setup_gcloud
    
    while true; do
        show_menu
        read -p "Select an option (1-6): " choice
        
        case $choice in
            1)
                enable_apis
                create_registries
                configure_docker
                print_success "Setup completed successfully!"
                ;;
            2)
                deploy_ai_service
                ;;
            3)
                deploy_api_server
                ;;
            4)
                deploy_ai_service
                sleep 2
                deploy_api_server
                print_success "Both services deployed successfully!"
                ;;
            5)
                print_info "AI Service Status:"
                gcloud run services describe ai-service --region=us-central1 --format="table(metadata.name,status.url)" 2>/dev/null || print_warning "AI Service not deployed"
                echo ""
                print_info "API Server Status:"
                gcloud run services describe api-server --region=us-central1 --format="table(metadata.name,status.url)" 2>/dev/null || print_warning "API Server not deployed"
                ;;
            6)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-6."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main

