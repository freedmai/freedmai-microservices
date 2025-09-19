#!/bin/bash

# Simple UAT Deployment for API Gateway
set -e

ECR_REGISTRY="339713159370.dkr.ecr.us-east-1.amazonaws.com"
JWT_SECRET="uat-jwt-secret-key-2025"

echo "🚀 Starting Simple UAT Deployment..."

# Create logs directory
mkdir -p logs

# Login to ECR
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull the image
sudo docker pull $ECR_REGISTRY/freedmai-api-gateway:latest

# Stop existing container if running
sudo docker stop freedmai-api-gateway-uat 2>/dev/null || true
sudo docker rm freedmai-api-gateway-uat 2>/dev/null || true

# Run the API Gateway container
sudo docker run -d \
  --name freedmai-api-gateway-uat \
  -p 3000:3000 \
  -e NODE_ENV=uat \
  -e JWT_SECRET=$JWT_SECRET \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  $ECR_REGISTRY/freedmai-api-gateway:latest

# Wait for container to start
echo "⏳ Waiting for service to start..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3000/health; then
    echo ""
    echo "✅ API Gateway is healthy and running!"
    echo "🌐 Service URL: http://localhost:3000"
    echo "🔍 Health check: http://localhost:3000/health"
else
    echo ""
    echo "❌ Health check failed!"
    echo "📋 Container logs:"
    sudo docker logs freedmai-api-gateway-uat
    exit 1
fi

echo ""
echo "📊 Container status:"
sudo docker ps --filter name=freedmai-api-gateway-uat --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎉 Simple UAT deployment completed successfully!"
