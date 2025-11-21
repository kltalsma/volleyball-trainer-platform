#!/bin/bash

RAILWAY_URL=$1

if [ -z "$RAILWAY_URL" ]; then
  echo "Usage: $0 <railway-url>"
  echo "Example: $0 https://volleyball-trainer-platform-production.up.railway.app"
  exit 1
fi

echo "⚠️  WARNING: This will DELETE EVERYTHING from production!"
echo "   ALL users, teams, exercises, trainings, workouts will be removed!"
echo "   Railway URL: $RAILWAY_URL"
echo ""
read -p "Type 'RESET' to confirm complete database reset: " confirm

if [ "$confirm" != "RESET" ]; then
  echo "❌ Cancelled"
  exit 0
fi

echo ""
echo "🗑️  Resetting production database completely..."

# Call the reset endpoint
curl -X POST "$RAILWAY_URL/api/seed/reset" \
  -H "Content-Type: application/json" \
  -d '{"confirmReset": "YES_RESET_EVERYTHING"}' \
  -s | jq '.'

echo ""
echo "✅ Done! Database has been completely reset and reseeded"
echo "   Login: kltalsma@gmail.com / password123"
echo "   Expected:"
echo "   • 11 teams"
echo "   • 45 exercises"
echo "   • 462 training workouts"
echo "   • 97 users"
