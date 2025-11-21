#!/bin/bash

# Script to seed production database
# Usage: ./scripts/seed-production.sh [PRODUCTION_URL]

if [ -z "$1" ]; then
    echo "❌ Error: Production URL is required"
    echo ""
    echo "Usage: ./scripts/seed-production.sh https://your-app.railway.app"
    echo ""
    echo "This will:"
    echo "  1. Run migrations on production database"
    echo "  2. Seed the database with test data"
    echo ""
    exit 1
fi

PRODUCTION_URL=$1

echo "🌱 Seeding production database at: $PRODUCTION_URL"
echo ""
echo "⚠️  WARNING: This will add seed data to production!"
echo "   - Teams, users, exercises, workouts will be created"
echo "   - Existing data will NOT be deleted"
echo "   - Duplicate entries will be skipped (upsert)"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🚀 Calling seed API endpoint..."
echo ""

response=$(curl -X POST "$PRODUCTION_URL/api/seed" \
    -H "Content-Type: application/json" \
    -w "\nHTTP_STATUS:%{http_code}" \
    2>/dev/null)

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_status" = "200" ]; then
    echo "✅ Production database seeded successfully!"
else
    echo "❌ Seed failed with status: $http_status"
    exit 1
fi
