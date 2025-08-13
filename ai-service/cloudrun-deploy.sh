#!/bin/bash
set -e

# Generate unique tag
export IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
export FULL_IMAGE="us-central1-docker.pkg.dev/cenphiio/cenphi-ai-service-repo/ai-service-grpc:$IMAGE_TAG"

echo "🚀 Building and deploying with tag: $IMAGE_TAG"

# Build
docker buildx build --platform linux/amd64 -f Dockerfile.cloudrun -t ai-service-grpc:$IMAGE_TAG .

# Tag and push
docker tag ai-service-grpc:$IMAGE_TAG $FULL_IMAGE
docker push $FULL_IMAGE

# Update YAML
sed -i.bak "s|us-central1-docker.pkg.dev/cenphiio/cenphi-ai-service-repo/ai-service-grpc:.*|$FULL_IMAGE|g" cloudrun-service.yaml

# Deploy
gcloud run services replace cloudrun-service.yaml --region=us-central1

echo "✅ Deployed successfully with image: $FULL_IMAGE"
