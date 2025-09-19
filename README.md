# FreedmAI Microservices - UAT Environment

Complete microservices architecture for FreedmAI with CI/CD pipeline, following the implementation steps from the documentation.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Load Balancer │────│      Nginx       │────│    API Gateway      │
│      (ALB)      │    │  Reverse Proxy   │    │    (Port 3000)      │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼───┐ ┌─────▼─────┐ ┌──▼──────┐
            │Auth Service│ │Billing Svc│ │Payment  │
            │(Port 3001) │ │(Port 3002)│ │(Port 3003)│
            └────────────┘ └───────────┘ └─────────┘
                    │           │           │
            ┌───────▼───┐ ┌─────▼─────┐
            │User Service│ │Notification│
            │(Port 3004) │ │(Port 3005) │
            └────────────┘ └────────────┘
```

## 🚀 Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **API Gateway** | 3000 | Central routing and load balancing | `/health` |
| **Auth Service** | 3001 | Authentication and authorization | `/api/auth/health` |
| **Billing Service** | 3002 | Bill management and validation | `/api/billing/health` |
| **Payment Service** | 3003 | Payment processing | `/api/payment/health` |
| **User Service** | 3004 | User profile management | `/api/user/health` |
| **Notification Service** | 3005 | Notifications and alerts | `/api/notification/health` |

## 📋 Prerequisites

- Docker and Docker Compose
- AWS CLI configured
- ECR repositories created
- GitHub Actions runner (for automated deployment)

## 🛠️ Quick Start

### 1. Deploy Infrastructure
```bash
cd terraform/
terraform init
terraform apply
```

### 2. Build and Push Images
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push all services (run from each service directory)
docker build -t YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/freedmai-SERVICE_NAME:latest .
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/freedmai-SERVICE_NAME:latest
```

### 3. Deploy to UAT
```bash
# Set environment variables
export ECR_REGISTRY="YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com"
export IMAGE_TAG="latest"
export JWT_SECRET="your-jwt-secret"

# Deploy all services
./deploy-uat.sh
```

### 4. Test APIs
```bash
./test-apis.sh
```

## 🔧 Manual Deployment

```bash
# Start all services
docker-compose -f docker-compose.uat.yml up -d

# Check status
docker-compose -f docker-compose.uat.yml ps

# View logs
docker-compose -f docker-compose.uat.yml logs -f

# Stop all services
docker-compose -f docker-compose.uat.yml down
```

## 🌐 API Endpoints

### Auth Service (`/api/auth`)
- `POST /login` - User login
- `POST /verify` - Token verification
- `POST /logout` - User logout

### Billing Service (`/api/billing`)
- `GET /billers` - Get supported billers
- `GET /bills/:userId` - Get user bills
- `POST /fetch-bill` - Fetch bill details
- `POST /validate-bill` - Validate bill parameters

### Payment Service (`/api/payment`)
- `GET /payment-modes` - Get payment modes
- `POST /process-payment` - Process payment
- `GET /status/:transactionId` - Check payment status
- `GET /history/:userId` - Get payment history

### User Service (`/api/user`)
- `GET /users` - Get all users
- `GET /profile/:userId` - Get user profile
- `PUT /profile/:userId` - Update user profile

### Notification Service (`/api/notification`)
- `GET /templates` - Get notification templates
- `POST /send` - Send notification
- `GET /user/:userId` - Get user notifications
- `PUT /read/:notificationId` - Mark as read

## 🔍 Monitoring

### Health Checks
```bash
# Check all services
curl http://localhost/health
curl http://localhost/api/auth/health
curl http://localhost/api/billing/health
curl http://localhost/api/payment/health
curl http://localhost/api/user/health
curl http://localhost/api/notification/health
```

### Logs
```bash
# View all logs
docker-compose -f docker-compose.uat.yml logs -f

# View specific service logs
docker-compose -f docker-compose.uat.yml logs -f auth-service
docker-compose -f docker-compose.uat.yml logs -f billing-service
```

### Container Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 🚨 Troubleshooting

### Service Not Starting
```bash
# Check container logs
docker logs freedmai-SERVICE_NAME-uat

# Check if port is available
netstat -tulpn | grep :PORT

# Restart specific service
docker-compose -f docker-compose.uat.yml restart SERVICE_NAME
```

### Health Check Failing
```bash
# Test direct service connection
curl http://localhost:PORT/health

# Check service dependencies
docker-compose -f docker-compose.uat.yml ps
```

### Network Issues
```bash
# Check Docker network
docker network ls
docker network inspect freedmai-network

# Test inter-service communication
docker exec freedmai-api-gateway-uat curl http://auth-service:3001/health
```

## 📊 Performance Testing

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 http://localhost/health

# Load test specific endpoints
ab -n 100 -c 5 -H "Content-Type: application/json" -p test-data.json http://localhost/api/auth/login
```

## 🔐 Security

- All services run as non-root users
- Security headers enabled in Nginx
- Rate limiting configured
- CORS protection enabled
- JWT token-based authentication

## 💰 Cost Optimization

**Current UAT Setup:**
- 1x EC2 t3.small: ~$15/month
- ECR storage: ~$2/month
- CloudWatch logs: FREE (within limits)
- **Total: ~$17/month**

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale specific service
docker-compose -f docker-compose.uat.yml up -d --scale auth-service=2
```

### Resource Limits
Services are configured with memory limits in docker-compose.yml

## 🔄 CI/CD Integration

### GitHub Actions Deployment
```bash
# Deploy all services
gh workflow run deploy-all-uat.yml -f services=all -f image_tag=latest

# Deploy specific services
gh workflow run deploy-all-uat.yml -f services=auth-service,billing-service -f image_tag=v1.0.1
```

## 📚 Documentation

- [Implementation Steps PDF](document/api-gateway-implementation-steps.pdf)
- [Architecture Approach PDF](document/cicd-approach.pdf)
- [BillAvenue API Reference](document/FreedmAI_Complete_API_Documentation.pdf)

## 🆘 Support

- Check logs: `docker-compose -f docker-compose.uat.yml logs -f`
- Health checks: `./test-apis.sh`
- Container status: `docker ps`
- Network issues: `docker network inspect freedmai-network`

---

**Environment**: UAT  
**Last Updated**: September 19, 2025  
**Status**: ✅ Ready for Testing
