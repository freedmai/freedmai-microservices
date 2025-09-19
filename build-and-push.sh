#!/bin/bash

# Build and Push All Microservices to ECR
set -e

ECR_REGISTRY="339713159370.dkr.ecr.us-east-1.amazonaws.com"
IMAGE_TAG="latest"

echo "🚀 Building and pushing all microservices to ECR..."

# Services to build
services=("api-gateway" "auth-service" "billing-service" "payment-service" "user-service" "notification-service")

for service in "${services[@]}"; do
    echo "📦 Building $service..."
    
    if [ -d "/var/Freedm/project/$service" ]; then
        cd "/var/Freedm/project/$service"
        
        # Build Docker image
        sudo docker build -t $ECR_REGISTRY/freedmai-$service:$IMAGE_TAG .
        
        # Push to ECR
        echo "📤 Pushing $service to ECR..."
        sudo docker push $ECR_REGISTRY/freedmai-$service:$IMAGE_TAG
        
        echo "✅ $service completed successfully!"
    else
        echo "❌ Directory not found: /var/Freedm/project/$service"
    fi
    
    echo ""
done

echo "🎉 All microservices built and pushed successfully!"
echo ""
echo "📋 Images pushed:"
for service in "${services[@]}"; do
    echo "  - $ECR_REGISTRY/freedmai-$service:$IMAGE_TAG"
done
