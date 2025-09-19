#!/bin/bash

# FreedmAI Microservices Stop Script
echo "🛑 Stopping FreedmAI Microservices..."

PROJECT_ROOT="/var/Freedm/project"

# Function to stop a service
stop_service() {
    local service_name=$1
    local service_path=$2
    
    cd "$service_path"
    
    if [ -f "${service_name}.pid" ]; then
        local pid=$(cat "${service_name}.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $service_name (PID: $pid)..."
            kill "$pid"
            rm "${service_name}.pid"
            echo "✅ $service_name stopped"
        else
            echo "⚠️  $service_name was not running"
            rm "${service_name}.pid"
        fi
    else
        echo "⚠️  No PID file found for $service_name"
    fi
    
    cd - > /dev/null
}

# Stop services
stop_service "api-gateway" "$PROJECT_ROOT/api-gateway"
stop_service "notification-service" "$PROJECT_ROOT/notification-service"
stop_service "otp-service" "$PROJECT_ROOT/otp-service"
stop_service "user-service" "$PROJECT_ROOT/user-service"

echo ""
echo "🎉 All microservices stopped!"
