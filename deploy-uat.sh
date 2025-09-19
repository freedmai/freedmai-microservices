#!/bin/bash

# FreedmAI UAT Deployment Script
# This script deploys all microservices to UAT environment

set -e

echo "🚀 Starting FreedmAI UAT Deployment..."

# Configuration
ECR_REGISTRY="${ECR_REGISTRY:-your-account.dkr.ecr.us-east-1.amazonaws.com}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
JWT_SECRET="${JWT_SECRET:-uat-jwt-secret-key}"

# Export environment variables
export ECR_REGISTRY
export IMAGE_TAG
export JWT_SECRET

# Create log directories
echo "📁 Creating log directories..."
mkdir -p logs/{api-gateway,auth-service,billing-service,payment-service,user-service,notification-service,nginx}

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker pull $ECR_REGISTRY/freedmai-api-gateway:$IMAGE_TAG
docker pull $ECR_REGISTRY/freedmai-auth-service:$IMAGE_TAG
docker pull $ECR_REGISTRY/freedmai-billing-service:$IMAGE_TAG
docker pull $ECR_REGISTRY/freedmai-payment-service:$IMAGE_TAG
docker pull $ECR_REGISTRY/freedmai-user-service:$IMAGE_TAG
docker pull $ECR_REGISTRY/freedmai-notification-service:$IMAGE_TAG

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.uat.yml down || true

# Start new containers
echo "▶️ Starting new containers..."
docker-compose -f docker-compose.uat.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🏥 Performing health checks..."

services=("api-gateway:3000" "auth-service:3001" "billing-service:3002" "payment-service:3003" "user-service:3004" "notification-service:3005")

for service in "${services[@]}"; do
    service_name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    echo "Checking $service_name..."
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service_name is healthy"
    else
        echo "❌ $service_name health check failed"
        exit 1
    fi
done

# Check Nginx
echo "Checking Nginx..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx is healthy"
else
    echo "❌ Nginx health check failed"
    exit 1
fi

# Display running containers
echo "📊 Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Display service URLs
echo ""
echo "🌐 Service URLs:"
echo "API Gateway: http://localhost/"
echo "Auth Service: http://localhost/api/auth/"
echo "Billing Service: http://localhost/api/billing/"
echo "Payment Service: http://localhost/api/payment/"
echo "User Service: http://localhost/api/user/"
echo "Notification Service: http://localhost/api/notification/"

echo ""
echo "✅ UAT Deployment completed successfully!"
echo "🔍 Check logs with: docker-compose -f docker-compose.uat.yml logs -f [service-name]"
