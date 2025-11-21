#!/bin/bash

# Clear and Re-seed Production Database
# This script clears all teams, exercises, and related data, then triggers a fresh seed

RAILWAY_URL="${1:-https://volleyball-trainer-platform-production.up.railway.app}"

echo "⚠️  WARNING: This will DELETE all teams, exercises, trainings, and workouts from production!"
echo "   (Users and sports will be preserved)"
echo "   Railway URL: $RAILWAY_URL"
echo ""
read -p "Type 'yes' to confirm: " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo "🗑️  Clearing and reseeding production data..."

curl -X POST "$RAILWAY_URL/api/seed/clear" \
  -H "Content-Type: application/json" \
  -d '{"confirmClear": "YES_CLEAR_ALL_DATA"}' \
  -w "\n\n"

echo ""
echo "✅ Done! Check your Railway logs for detailed output"
echo "   Login: kltalsma@gmail.com / password123"
echo "   Expected:"
echo "   • 11 teams"
echo "   • 15+ exercises"
echo "   • 100+ team members"
