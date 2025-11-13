#!/bin/bash

echo "🧪 Testing Analytics System"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Send events
echo -e "${BLUE}📤 Sending test events...${NC}"
echo ""

# Event 1 - Home page
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site-abc-123",
    "event_type": "page_view",
    "path": "/",
    "user_id": "user-123",
    "timestamp": "2025-11-14T10:00:00Z"
  }' && echo ""

sleep 0.5

# Event 2 - Pricing page
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site-abc-123",
    "event_type": "page_view",
    "path": "/pricing",
    "user_id": "user-456",
    "timestamp": "2025-11-14T10:05:00Z"
  }' && echo ""

sleep 0.5

# Event 3 - Blog post
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site-abc-123",
    "event_type": "page_view",
    "path": "/blog/post-1",
    "user_id": "user-123",
    "timestamp": "2025-11-14T10:10:00Z"
  }' && echo ""

sleep 0.5

# Event 4 - Another pricing view
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site-abc-123",
    "event_type": "page_view",
    "path": "/pricing",
    "user_id": "user-789",
    "timestamp": "2025-11-14T10:15:00Z"
  }' && echo ""

sleep 0.5

# Event 5 - Different site
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site-xyz-999",
    "event_type": "page_view",
    "path": "/contact",
    "user_id": "user-111",
    "timestamp": "2025-11-14T10:20:00Z"
  }' && echo ""

echo ""
echo -e "${GREEN}✓ Sent 5 test events${NC}"
echo ""

# Wait for processing
echo -e "${BLUE}⏳ Waiting 3 seconds for processing...${NC}"
sleep 3
echo ""

# Test 2: Get stats
echo -e "${BLUE}📊 Fetching statistics...${NC}"
echo ""

echo "Stats for site-abc-123:"
curl "http://localhost:3000/api/stats?site_id=site-abc-123" | json_pp 2>/dev/null || curl "http://localhost:3000/api/stats?site_id=site-abc-123"
echo ""
echo ""

echo "Stats for site-abc-123 on 2025-11-14:"
curl "http://localhost:3000/api/stats?site_id=site-abc-123&date=2025-11-14" | json_pp 2>/dev/null || curl "http://localhost:3000/api/stats?site_id=site-abc-123&date=2025-11-14"
echo ""
echo ""

echo "Stats for site-xyz-999:"
curl "http://localhost:3000/api/stats?site_id=site-xyz-999" | json_pp 2>/dev/null || curl "http://localhost:3000/api/stats?site_id=site-xyz-999"
echo ""
echo ""

echo -e "${GREEN}✅ Test completed!${NC}"
