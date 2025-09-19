#!/bin/bash

# FreedmAI API Testing Script
# Tests all microservices endpoints

set -e

BASE_URL="${BASE_URL:-http://localhost}"
echo "🧪 Testing FreedmAI APIs at $BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo -n "Testing $method $endpoint... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    fi
    
    status_code="${response: -3}"
    body="${response%???}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
    fi
}

echo ""
echo "=== Health Checks ==="
test_endpoint "GET" "/health" "" 200
test_endpoint "GET" "/api/auth/health" "" 200
test_endpoint "GET" "/api/billing/health" "" 200
test_endpoint "GET" "/api/payment/health" "" 200
test_endpoint "GET" "/api/user/health" "" 200
test_endpoint "GET" "/api/notification/health" "" 200

echo ""
echo "=== Auth Service Tests ==="
test_endpoint "POST" "/api/auth/login" '{"email":"admin@freedmai.com","password":"password"}' 200
test_endpoint "POST" "/api/auth/verify" '{"token":"invalid-token"}' 401
test_endpoint "POST" "/api/auth/logout" '{}' 200

echo ""
echo "=== Billing Service Tests ==="
test_endpoint "GET" "/api/billing/billers" "" 200
test_endpoint "GET" "/api/billing/bills/1" "" 200
test_endpoint "POST" "/api/billing/fetch-bill" '{"billerId":"MSEB00000NAT01","consumerNumber":"1234567890"}' 200
test_endpoint "POST" "/api/billing/validate-bill" '{"billerId":"MSEB00000NAT01","consumerNumber":"1234567890"}' 200

echo ""
echo "=== Payment Service Tests ==="
test_endpoint "GET" "/api/payment/payment-modes" "" 200
test_endpoint "POST" "/api/payment/process-payment" '{"billerId":"MSEB00000NAT01","consumerNumber":"1234567890","amount":150000,"paymentMode":"UPI","customerInfo":{"userId":1}}' 200
test_endpoint "GET" "/api/payment/history/1" "" 200

echo ""
echo "=== User Service Tests ==="
test_endpoint "GET" "/api/user/users" "" 200
test_endpoint "GET" "/api/user/profile/1" "" 200
test_endpoint "PUT" "/api/user/profile/1" '{"name":"Updated Name","profile":{"phone":"9876543210"}}' 200

echo ""
echo "=== Notification Service Tests ==="
test_endpoint "GET" "/api/notification/templates" "" 200
test_endpoint "POST" "/api/notification/send" '{"userId":1,"type":"payment_success","message":"Test notification"}' 200
test_endpoint "GET" "/api/notification/user/1" "" 200

echo ""
echo "=== Load Test (10 concurrent requests) ==="
for i in {1..10}; do
    curl -s "$BASE_URL/health" > /dev/null &
done
wait
echo -e "${GREEN}✅ Load test completed${NC}"

echo ""
echo "=== API Testing Complete ==="
echo "🔍 Check individual service logs:"
echo "  docker-compose -f docker-compose.uat.yml logs -f [service-name]"
