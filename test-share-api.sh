#!/bin/bash

echo "=== Testing Share API Endpoints ==="
echo ""

# Test 1: Check if API server is running
echo "1. Testing API server health..."
curl -s http://localhost:8081/api/health | jq '.' || echo "FAILED: API server not responding"
echo ""

# Test 2: Check widget JavaScript file
echo "2. Testing widget JavaScript file..."
curl -s -I http://localhost:8081/api/share-widget.js | head -5
echo ""

# Test 3: Test widget config endpoint (will fail without valid share ID)
echo "3. Testing widget config endpoint..."
curl -s http://localhost:8081/api/widget/config/test-id | head -5
echo ""

echo "=== Test Complete ==="
echo ""
echo "Next steps:"
echo "1. Restart the API server: cd api-server && ./cmd/cmd"
echo "2. Check browser console for 'PublicShareView - API Response:' logs"
echo "3. Open ShareModal and check network tab for actual requests"
