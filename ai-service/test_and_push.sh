#!/bin/bash

# Push your ready image to Docker Hub

echo "🚀 Pushing RunPod-ready image to Docker Hub"
echo "============================================"

# Your image details
IMAGE_NAME="lorddickson/cenphi-ai-service"
echo "Image: $IMAGE_NAME"
echo "Size: 12.1GB ✅"
echo "Status: Ready for production ✅"
echo ""

# Check if you're logged in to Docker Hub
echo "🔐 Checking Docker Hub authentication..."
if docker info | grep -q "Username"; then
    echo "✅ Already logged in to Docker Hub"
else
    echo "🔑 Please log in to Docker Hub:"
    docker login
fi

echo ""
echo "📤 Pushing all tags..."
echo "This will take a few minutes due to the 12.1GB size..."

# Push all your tags
echo "Pushing: $IMAGE_NAME:runpod"
docker push $IMAGE_NAME:runpod

echo "Pushing: $IMAGE_NAME:latest" 
docker push $IMAGE_NAME:latest

echo "Pushing versioned tag..."
# Get the versioned tag (the timestamp one)
VERSIONED_TAG=$(docker images $IMAGE_NAME --format "{{.Tag}}" | grep -E "^[0-9]{8}-[0-9]{6}$" | head -1)
if [ ! -z "$VERSIONED_TAG" ]; then
    echo "Pushing: $IMAGE_NAME:$VERSIONED_TAG"
    docker push $IMAGE_NAME:$VERSIONED_TAG
fi

echo ""
echo "✅ Push complete!"
echo ""
echo "🌐 Your images are now available on Docker Hub:"
echo "├── $IMAGE_NAME:runpod (recommended for RunPod)"
echo "├── $IMAGE_NAME:latest"
echo "└── $IMAGE_NAME:$VERSIONED_TAG"
echo ""
echo "🎯 Next Steps:"
echo "1. Go to RunPod Console: https://www.runpod.io/console"
echo "2. Create template with: $IMAGE_NAME:runpod"
echo "3. Deploy and test!"
echo ""
echo "💡 Tip: Use '$IMAGE_NAME:runpod' in RunPod for clarity"