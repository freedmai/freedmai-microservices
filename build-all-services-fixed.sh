#!/bin/bash

# Build All Microservices for UAT
set -e

ECR_REGISTRY="339713159370.dkr.ecr.us-east-1.amazonaws.com"
IMAGE_TAG="latest"

echo "🚀 Building all remaining microservices..."

# Login to ECR
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin $ECR_REGISTRY

# Services with their ports
declare -A service_ports=(
    ["auth-service"]="3001"
    ["billing-service"]="3002"
    ["payment-service"]="3003"
    ["user-service"]="3004"
    ["notification-service"]="3005"
)

for service in "${!service_ports[@]}"; do
    port=${service_ports[$service]}
    echo ""
    echo "📦 Building $service (port $port)..."
    
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
EXPOSE $port
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
for service in "${!service_ports[@]}"; do
    echo "  - $ECR_REGISTRY/freedmai-$service:$IMAGE_TAG"
done
