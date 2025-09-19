#!/bin/bash

# FreedmAI Microservices Startup Script
echo "🚀 Starting FreedmAI Microservices..."

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo "Starting $service_name on port $port..."
    cd "$service_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies for $service_name..."
        npm install
    fi
    
    # Start the service in background
    nohup npm start > "${service_name}.log" 2>&1 &
    echo $! > "${service_name}.pid"
    
    echo "✅ $service_name started (PID: $(cat ${service_name}.pid))"
    cd - > /dev/null
}

# Start services in order
PROJECT_ROOT="/var/Freedm/project"

# 1. Start User Service (port 3001)
start_service "user-service" "$PROJECT_ROOT/user-service" 3001

# 2. Start OTP Service (port 3007)  
start_service "otp-service" "$PROJECT_ROOT/otp-service" 3007

# 3. Start Notification Service (port 3006)
start_service "notification-service" "$PROJECT_ROOT/notification-service" 3006

# 4. Start API Gateway (port 3000)
start_service "api-gateway" "$PROJECT_ROOT/api-gateway" 3000

echo ""
echo "🎉 All microservices started!"
echo ""
echo "Service URLs:"
echo "  API Gateway:         http://localhost:3000"
echo "  User Service:        http://localhost:3001"
echo "  OTP Service:         http://localhost:3007"
echo "  Notification Service: http://localhost:3006"
echo ""
echo "Health Checks:"
echo "  Gateway Health:      http://localhost:3000/health"
echo "  API Documentation:   http://localhost:3000/api-docs"
echo ""
echo "To stop all services, run: ./stop-microservices.sh"
