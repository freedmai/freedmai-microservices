#!/bin/bash

# GitHub Repository Setup Script for FreedmAI CI/CD
set -e

echo "🚀 Setting up GitHub repository for FreedmAI CI/CD..."

# Configuration
GITHUB_ORG="freedmai"
REPO_NAME="freedmai-microservices"
REPO_DESCRIPTION="FreedmAI Microservices with Complete CI/CD Pipeline"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Installing..."
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update && sudo apt install gh -y
fi

# Authenticate with GitHub (if not already authenticated)
if ! gh auth status &> /dev/null; then
    echo "🔐 Please authenticate with GitHub..."
    gh auth login
fi

# Create repository
echo "📁 Creating GitHub repository..."
if gh repo view $GITHUB_ORG/$REPO_NAME &> /dev/null; then
    echo "Repository already exists. Using existing repository."
else
    gh repo create $GITHUB_ORG/$REPO_NAME --public --description "$REPO_DESCRIPTION"
fi

# Initialize git repository
echo "🔧 Initializing git repository..."
git init
git branch -M main

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Logs
logs
*.log
deployment-ui.log
*.pid

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Docker
.dockerignore

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl

# Backup files
backups/
*.backup

# Test results
test-results/
coverage/
*.xml
*.json.log

# Build artifacts
dist/
build/
EOF

# Create README.md
echo "📖 Creating README.md..."
cat > README.md << 'EOF'
# FreedmAI Microservices Platform

Complete microservices architecture with CI/CD pipeline for electricity bill payment system.

## 🏗️ Architecture

- **6 Microservices**: API Gateway, Auth, Billing, Payment, User, Notification
- **Container Orchestration**: Docker Compose
- **Infrastructure**: AWS (ECR, CloudWatch, SSM)
- **CI/CD**: GitHub Actions with automated testing
- **Monitoring**: Health checks, logging, deployment UI

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/freedmai/freedmai-microservices.git
cd freedmai-microservices

# Deploy infrastructure
cd terraform && terraform apply

# Build and deploy services
./deploy-complete-stack.sh

# Run tests
./test-apis.sh
```

## 🌐 Access Points

- **API Gateway**: http://localhost:3000
- **Main API**: http://localhost/ (via Nginx)
- **Deployment UI**: http://localhost:8080

## 📊 Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Central routing and load balancing |
| Auth Service | 3001 | JWT authentication |
| Billing Service | 3002 | Bill management |
| Payment Service | 3003 | Payment processing |
| User Service | 3004 | User management |
| Notification Service | 3005 | Notifications |

## 🔄 CI/CD Pipeline

- **Automated Testing**: Unit, integration, security, performance
- **Code Quality**: ESLint, security scanning
- **Deployment**: Automated with approval gates
- **Monitoring**: Health checks and rollback capabilities

## 📚 Documentation

- [Complete Implementation Guide](document/complete-implementation-guide.pdf)
- [API Documentation](document/deployement/FreedmAI_Complete_API_Documentation.pdf)
- [Deployment Process](document/deployement/uat-deployment-process.pdf)

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run service locally
cd [service-name] && npm start

# Run tests
npm test

# Build Docker image
docker build -t freedmai-[service-name] .
```

## 🚀 Deployment

### Manual Deployment
```bash
# Deploy to UAT
./deploy-complete-stack.sh

# Deploy specific services
docker-compose -f docker-compose-complete.yml up -d [service-name]
```

### CI/CD Deployment
```bash
# Trigger deployment via GitHub Actions
gh workflow run ci-cd-pipeline.yml -f environment=uat -f services=all
```

## 📈 Monitoring

- **Health Checks**: All services have `/health` endpoints
- **Logs**: Centralized logging with Winston
- **Metrics**: Performance and error tracking
- **Deployment UI**: Real-time monitoring at http://localhost:8080

## 🔒 Security

- Non-root containers
- JWT authentication
- Rate limiting
- Security headers
- Vulnerability scanning

## 💰 Cost

- **UAT Environment**: ~$2/month
- **Production**: ~$72/month (estimated)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.
EOF

# Create GitHub Actions secrets setup script
echo "🔐 Creating secrets setup script..."
cat > setup-github-secrets.sh << 'EOF'
#!/bin/bash

# GitHub Secrets Setup
echo "Setting up GitHub repository secrets..."

# AWS Role ARN (replace with your actual role ARN)
gh secret set AWS_ROLE_ARN --body "arn:aws:iam::339713159370:role/GitHubActionsRole-FreedmAI"

# ECR Registry
gh secret set ECR_REGISTRY --body "339713159370.dkr.ecr.us-east-1.amazonaws.com"

# JWT Secret for UAT
gh secret set JWT_SECRET --body "uat-jwt-secret-key-2025"

# Database URL (if using database)
gh secret set DATABASE_URL --body "postgresql://user:pass@localhost:5432/freedmai"

echo "✅ GitHub secrets configured successfully!"
EOF

chmod +x setup-github-secrets.sh

# Create environment setup
echo "🌍 Creating environment configurations..."
mkdir -p .github/environments

# UAT environment
cat > .github/environments/uat.yml << 'EOF'
name: uat
url: http://localhost:3000
protection_rules:
  - type: required_reviewers
    required_reviewers: 1
variables:
  ENVIRONMENT: uat
  LOG_LEVEL: debug
EOF

# Production environment
cat > .github/environments/production.yml << 'EOF'
name: production
url: https://api.freedmai.com
protection_rules:
  - type: required_reviewers
    required_reviewers: 2
  - type: wait_timer
    wait_timer: 5
variables:
  ENVIRONMENT: production
  LOG_LEVEL: info
EOF

# Create test configuration
echo "🧪 Creating test configurations..."
mkdir -p tests/{unit,integration,e2e,api}

# Create Postman collection template
cat > tests/api/freedmai-api-tests.postman_collection.json << 'EOF'
{
  "info": {
    "name": "FreedmAI API Tests",
    "description": "Comprehensive API tests for FreedmAI microservices",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Checks",
      "item": [
        {
          "name": "API Gateway Health",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/health",
              "host": ["{{base_url}}"],
              "path": ["health"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response has healthy status', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData.status).to.eql('healthy');",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    }
  ]
}
EOF

# Create test environment
cat > tests/api/test-environment.json << 'EOF'
{
  "id": "test-env",
  "name": "Test Environment",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "",
      "enabled": true
    }
  ]
}
EOF

# Add all files to git
echo "📦 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Complete FreedmAI microservices with CI/CD pipeline

Features:
- 6 microservices (API Gateway, Auth, Billing, Payment, User, Notification)
- Complete Docker Compose orchestration
- GitHub Actions CI/CD pipeline
- Automated testing (unit, integration, security, performance)
- Deployment approval workflows
- Infrastructure as Code (Terraform)
- Comprehensive documentation
- Deployment management UI

Services:
✅ API Gateway (3000) - Central routing
✅ Auth Service (3001) - JWT authentication  
✅ Billing Service (3002) - Bill management
✅ Payment Service (3003) - Payment processing
✅ User Service (3004) - User management
✅ Notification Service (3005) - Notifications

Infrastructure:
✅ 6 ECR repositories
✅ 6 CloudWatch log groups
✅ Terraform configuration
✅ Cost optimized (~$2/month UAT)

Testing:
✅ 23 API endpoints tested
✅ Automated test suites
✅ Security scanning
✅ Performance testing

Documentation:
✅ Complete implementation guide
✅ API documentation
✅ Deployment procedures"

# Set remote origin
echo "🔗 Setting remote origin..."
git remote add origin https://github.com/$GITHUB_ORG/$REPO_NAME.git

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

# Setup GitHub secrets
echo "🔐 Setting up GitHub secrets..."
./setup-github-secrets.sh

# Create GitHub environments
echo "🌍 Creating GitHub environments..."
gh api repos/$GITHUB_ORG/$REPO_NAME/environments/uat --method PUT --field protection_rules='[]'
gh api repos/$GITHUB_ORG/$REPO_NAME/environments/production --method PUT --field protection_rules='[{"type":"required_reviewers","reviewers":[{"type":"User","id":1}]}]'

echo ""
echo "🎉 GitHub repository setup complete!"
echo ""
echo "📋 Repository Details:"
echo "  Repository: https://github.com/$GITHUB_ORG/$REPO_NAME"
echo "  Actions: https://github.com/$GITHUB_ORG/$REPO_NAME/actions"
echo "  Environments: https://github.com/$GITHUB_ORG/$REPO_NAME/settings/environments"
echo ""
echo "🚀 Next Steps:"
echo "  1. Configure self-hosted runner for deployments"
echo "  2. Set up production infrastructure"
echo "  3. Configure monitoring and alerting"
echo "  4. Run first CI/CD pipeline"
echo ""
echo "🔧 Quick Commands:"
echo "  # Trigger deployment"
echo "  gh workflow run ci-cd-pipeline.yml -f environment=uat -f services=all"
echo ""
echo "  # Check workflow status"
echo "  gh run list"
echo ""
echo "  # View repository"
echo "  gh repo view $GITHUB_ORG/$REPO_NAME --web"
