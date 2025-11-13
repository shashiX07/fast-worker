#!/bin/bash

echo "🚀 Load Testing Analytics System"
echo "=================================="
echo ""

# Number of events to send
TOTAL_EVENTS=${1:-1000}

echo "Sending $TOTAL_EVENTS events..."
echo ""

# Paths to randomly select from
PATHS=("/home" "/pricing" "/blog/post-1" "/blog/post-2" "/about" "/contact" "/features" "/docs" "/api" "/dashboard")

# Start time
START_TIME=$(date +%s)

# Send events in parallel
for i in $(seq 1 $TOTAL_EVENTS)
do
  # Random values
  PATH_INDEX=$((RANDOM % 10))
  USER_ID=$((RANDOM % 500))
  HOUR=$((RANDOM % 24))
  MINUTE=$((RANDOM % 60))
  
  curl -s -X POST http://localhost:3000/api/event \
    -H "Content-Type: application/json" \
    -d "{
      \"site_id\": \"site-load-test\",
      \"event_type\": \"page_view\",
      \"path\": \"${PATHS[$PATH_INDEX]}\",
      \"user_id\": \"user-$USER_ID\",
      \"timestamp\": \"2025-11-14T$(printf '%02d' $HOUR):$(printf '%02d' $MINUTE):00Z\"
    }" > /dev/null &
  
  # Show progress every 100 events
  if [ $((i % 100)) -eq 0 ]; then
    echo "Sent $i events..."
  fi
done

# Wait for all background jobs to complete
wait

# End time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "✅ Sent $TOTAL_EVENTS events in $DURATION seconds"
echo "📊 Average: $((TOTAL_EVENTS / DURATION)) events/second"
echo ""
echo "⏳ Waiting 5 seconds for processing..."
sleep 5
echo ""

# Get stats
echo "📈 Fetching statistics..."
curl "http://localhost:3000/api/stats?site_id=site-load-test" | json_pp 2>/dev/null || curl "http://localhost:3000/api/stats?site_id=site-load-test"
echo ""
