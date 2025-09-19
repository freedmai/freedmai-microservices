#!/bin/bash

# Simple build script for UAT deployment
set -e

ECR_REGISTRY="339713159370.dkr.ecr.us-east-1.amazonaws.com"

echo "🚀 Building API Gateway for UAT..."

# Build API Gateway only for now
cd /var/Freedm/project/api-gateway

# Create a simple Dockerfile that works
cat > Dockerfile.simple << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --only=production

COPY src/ ./src/
RUN mkdir -p logs

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
EOF

# Build and push
sudo docker build -f Dockerfile.simple -t $ECR_REGISTRY/freedmai-api-gateway:latest .
sudo docker push $ECR_REGISTRY/freedmai-api-gateway:latest

echo "✅ API Gateway built and pushed successfully!"
