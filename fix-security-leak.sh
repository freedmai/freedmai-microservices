#!/bin/bash

echo "🚨 EMERGENCY SECURITY FIX"
echo "========================="

# 1. Remove .env file with exposed secrets
echo "🗑️ Removing exposed .env file..."
rm -f api-gateway/.env

# 2. Add .env to .gitignore if not already there
echo "📝 Updating .gitignore..."
if ! grep -q "\.env" .gitignore; then
    echo "# Environment files with secrets" >> .gitignore
    echo ".env" >> .gitignore
    echo "*.env" >> .gitignore
fi

# 3. Create template .env file
echo "📄 Creating .env template..."
cat > api-gateway/.env.template << 'TEMPLATE'
NODE_ENV=development
PORT=3000

# Microservice URLs
USER_SERVICE_URL=http://localhost:3001
OTP_SERVICE_URL=http://localhost:3007
NOTIFICATION_SERVICE_URL=http://localhost:3006

# JWT Configuration - CHANGE THIS IN PRODUCTION
JWT_SECRET=your-jwt-secret-here

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=freedm
DB_USER=freedm_user
DB_PASSWORD=your-db-password-here

# Logging
LOG_LEVEL=info
TEMPLATE

# 4. Update docker-compose to use environment variables
echo "🐳 Updating docker-compose..."
sed -i 's/JWT_SECRET=uat-jwt-secret-key-2025/JWT_SECRET=${JWT_SECRET:-secure-default-key}/g' docker-compose-complete.yml

echo "✅ Security fixes applied!"
echo ""
echo "🔧 Next steps:"
echo "1. Set environment variables: export JWT_SECRET='your-secure-secret'"
echo "2. Commit the security fixes"
echo "3. Force push to overwrite history (if needed)"
