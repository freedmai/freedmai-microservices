# FreedmAI API Gateway

Central API Gateway for FreedmAI microservices architecture.

## Features

- **Request Routing**: Path-based routing to microservices
- **Security**: Rate limiting, CORS, security headers
- **Monitoring**: Health checks and logging
- **Load Balancing**: Proxy middleware with failover

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run tests
npm test

# Build Docker image
docker build -t freedmai-api-gateway .
```

## Service Routes

- `/api/auth` → Authentication Service
- `/api/billing` → Billing Service  
- `/api/payment` → Payment Service
- `/api/user` → User Management Service
- `/api/notification` → Notification Service

## Deployment

### UAT Deployment
```bash
# Trigger via GitHub Actions
gh workflow run deploy-uat.yml -f image_tag=latest
```

### Production Deployment
```bash
# Requires UAT approval
gh workflow run deploy-prod.yml -f image_tag=v1.0.0 -f uat_approval_id=12345
```

## Configuration

Environment variables are managed through:
- `config/uat.env` - UAT environment
- `config/prod.env` - Production environment

## Infrastructure

Terraform configuration in `terraform/` directory:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Monitoring

- Health endpoint: `GET /health`
- Logs: CloudWatch Logs
- Metrics: Custom CloudWatch metrics
