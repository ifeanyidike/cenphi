#!/bin/bash

# Test frontend proxy configuration
# Usage: ./test_frontend_proxy.sh <share_id>

SHARE_ID=$1
FRONTEND_URL="http://localhost:3300"
API_URL="http://localhost:8081"

if [ -z "$SHARE_ID" ]; then
    echo "Usage: ./test_frontend_proxy.sh <share_id>"
    echo "Example: ./test_frontend_proxy.sh a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    exit 1
fi

echo "========================================="
echo "Testing Frontend Proxy Configuration"
echo "========================================="
echo ""
echo "Share ID: $SHARE_ID"
echo "Frontend: $FRONTEND_URL"
echo "API: $API_URL"
echo ""

# Test 1: Direct API access
echo "✅ Test 1: Direct API Access (Backend)"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/seo/transcript/$SHARE_ID")
if [ "$API_STATUS" -eq 200 ]; then
    echo "   ✅ PASS - API accessible (HTTP $API_STATUS)"
else
    echo "   ❌ FAIL - API not accessible (HTTP $API_STATUS)"
fi
echo ""

# Test 2: Frontend proxy access
echo "✅ Test 2: Frontend Proxy Access"
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/seo/transcript/$SHARE_ID")
if [ "$PROXY_STATUS" -eq 200 ]; then
    echo "   ✅ PASS - Proxy working (HTTP $PROXY_STATUS)"
else
    echo "   ❌ FAIL - Proxy not working (HTTP $PROXY_STATUS)"
    echo "   💡 Tip: Did you restart the frontend dev server?"
fi
echo ""

# Test 3: Check if HTML is returned
echo "✅ Test 3: HTML Response Check"
CONTENT_TYPE=$(curl -s -I "$FRONTEND_URL/seo/transcript/$SHARE_ID" | grep -i "content-type" | grep -i "html")
if [ -n "$CONTENT_TYPE" ]; then
    echo "   ✅ PASS - HTML content returned"
    echo "   $CONTENT_TYPE"
else
    echo "   ❌ FAIL - No HTML content"
fi
echo ""

# Test 4: Check for Open Graph tags
echo "✅ Test 4: Open Graph Tags in HTML"
OG_COUNT=$(curl -s "$FRONTEND_URL/seo/transcript/$SHARE_ID" | grep -c "property=\"og:")
if [ "$OG_COUNT" -gt 0 ]; then
    echo "   ✅ PASS - Found $OG_COUNT Open Graph tags"
else
    echo "   ❌ FAIL - No Open Graph tags found"
fi
echo ""

# Test 5: Test public share view proxy
echo "✅ Test 5: Public Share View Proxy"
SHARE_VIEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/share/$SHARE_ID/view")
if [ "$SHARE_VIEW_STATUS" -eq 200 ]; then
    echo "   ✅ PASS - Share view accessible (HTTP $SHARE_VIEW_STATUS)"
else
    echo "   ⚠️  INFO - Share view returned (HTTP $SHARE_VIEW_STATUS)"
fi
echo ""

echo "========================================="
echo "Testing Complete!"
echo "========================================="
echo ""
echo "If proxy tests failed, make sure to:"
echo "1. Restart frontend dev server: npm run dev"
echo "2. Check VITE_API_URL in .env: $API_URL"
echo "3. Verify API server is running on port 8081"
echo ""
echo "To view the page in browser:"
echo "👉 $FRONTEND_URL/seo/transcript/$SHARE_ID"
echo ""
