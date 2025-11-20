#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Volleyball Trainer Platform..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Checking if database is seeded..."
# Simple check - try to count users, if it fails the table doesn't exist or is empty
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM \"User\";" 2>/dev/null | grep -o '[0-9]\+' | tail -1 || echo "0")

if [ "$USER_COUNT" -eq "0" ]; then
    echo "🌱 Database is empty, running seed..."
    npm run db:seed
    echo "✅ Database seeded successfully!"
else
    echo "✅ Database already contains $USER_COUNT users, skipping seed"
fi

echo "🎯 Starting application server..."
exec node server.js