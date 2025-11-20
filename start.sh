#!/bin/sh

echo "🚀 Starting Volleyball Trainer Platform..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Running database migrations..."

# Generate Prisma client first (in case it wasn't built properly)
echo "🔧 Generating Prisma client..."
npx prisma generate || {
    echo "❌ Failed to generate Prisma client"
    exit 1
}

# Run migrations
echo "🔄 Deploying migrations..."
npx prisma migrate deploy || {
    echo "❌ Failed to deploy migrations"
    exit 1
}

echo "🌱 Checking if database needs seeding..."

# Simplified approach - try to run the seed regardless of current state
# The seed script itself should be idempotent
echo "🌱 Running database seed..."
npm run db:seed || {
    echo "⚠️  Seeding failed, but continuing with server startup..."
}

echo "✅ Database initialization complete!"
echo "🎯 Starting application server..."
exec node server.js