#!/bin/bash

# Deploy Complete FreedmAI Microservices Stack
set -e

ECR_REGISTRY="339713159370.dkr.ecr.us-east-1.amazonaws.com"

echo "🚀 Deploying Complete FreedmAI Microservices Stack..."

# Create log directories
echo "📁 Creating log directories..."
mkdir -p logs/{api-gateway,auth-service,billing-service,payment-service,user-service,notification-service,nginx}

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin $ECR_REGISTRY

# Stop existing single container if running
echo "🛑 Stopping existing single container..."
sudo docker stop freedmai-api-gateway-uat 2>/dev/null || true
sudo docker rm freedmai-api-gateway-uat 2>/dev/null || true

# Pull all images
echo "📥 Pulling all Docker images..."
services=("api-gateway" "auth-service" "billing-service" "payment-service" "user-service" "notification-service")

for service in "${services[@]}"; do
    echo "  Pulling freedmai-$service..."
    sudo docker pull $ECR_REGISTRY/freedmai-$service:latest
done

# Deploy with Docker Compose
echo "🚀 Starting complete microservices stack..."
sudo docker-compose -f docker-compose-complete.yml down || true
sudo docker-compose -f docker-compose-complete.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Health checks
echo "🏥 Performing health checks..."

services_ports=("api-gateway:3000" "auth-service:3001" "billing-service:3002" "payment-service:3003" "user-service:3004" "notification-service:3005")

all_healthy=true

for service_port in "${services_ports[@]}"; do
    service=$(echo $service_port | cut -d: -f1)
    port=$(echo $service_port | cut -d: -f2)
    
    echo -n "  Checking $service... "
    if curl -f -s http://localhost:$port/health > /dev/null; then
        echo "✅ Healthy"
    else
        echo "❌ Failed"
        all_healthy=false
    fi
done

# Check Nginx
echo -n "  Checking Nginx... "
if curl -f -s http://localhost/health > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Failed"
    all_healthy=false
fi

echo ""

if [ "$all_healthy" = true ]; then
    echo "🎉 All services are healthy and running!"
    echo ""
    echo "🌐 Service URLs:"
    echo "  Main Gateway: http://localhost/"
    echo "  API Gateway:  http://localhost:3000"
    echo "  Auth Service: http://localhost:3001 (via http://localhost/api/auth)"
    echo "  Billing:      http://localhost:3002 (via http://localhost/api/billing)"
    echo "  Payment:      http://localhost:3003 (via http://localhost/api/payment)"
    echo "  User:         http://localhost:3004 (via http://localhost/api/user)"
    echo "  Notification: http://localhost:3005 (via http://localhost/api/notification)"
else
    echo "❌ Some services failed health checks!"
    echo "📋 Container status:"
    sudo docker-compose -f docker-compose-complete.yml ps
    echo ""
    echo "📋 Check logs with:"
    echo "  sudo docker-compose -f docker-compose-complete.yml logs [service-name]"
    exit 1
fi

echo ""
echo "📊 Container Status:"
sudo docker-compose -f docker-compose-complete.yml ps

echo ""
echo "🎯 Complete Stack Deployment Successful!"
