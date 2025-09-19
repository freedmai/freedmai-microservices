#!/bin/bash

# Build All Microservices for UAT
set -e

ECR_REGISTRY="339713159370.dkr.ecr.us-east-1.amazonaws.com"
IMAGE_TAG="latest"

echo "🚀 Building all remaining microservices..."

# Login to ECR
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin $ECR_REGISTRY

# Services to build (excluding api-gateway which is already built)
services=("auth-service" "billing-service" "payment-service" "user-service" "notification-service")

for service in "${services[@]}"; do
    echo ""
    echo "📦 Building $service..."
    
    cd "/var/Freedm/project/$service"
    
    # Create optimized Dockerfile
    cat > Dockerfile.simple << EOF
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --only=production
COPY src/ ./src/
RUN mkdir -p logs
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 300${service: -1}
CMD ["npm", "start"]
EOF

    # Build image
    sudo docker build -f Dockerfile.simple -t $ECR_REGISTRY/freedmai-$service:$IMAGE_TAG .
    
    # Push to ECR
    echo "📤 Pushing $service..."
    sudo docker push $ECR_REGISTRY/freedmai-$service:$IMAGE_TAG
    
    echo "✅ $service completed!"
done

echo ""
echo "🎉 All microservices built and pushed successfully!"
echo ""
echo "📋 Images available:"
echo "  - $ECR_REGISTRY/freedmai-api-gateway:$IMAGE_TAG"
for service in "${services[@]}"; do
    echo "  - $ECR_REGISTRY/freedmai-$service:$IMAGE_TAG"
done
