#!/bin/bash

echo "🔍 Testing production admin access..."
echo ""

# Test health endpoint
echo "1. Health check:"
curl -s https://volleyball-trainer-platform-production.up.railway.app/api/health | jq .
echo ""

# Test workouts endpoint (should fail - needs auth)
echo "2. Workouts endpoint (without auth - should fail):"
curl -s https://volleyball-trainer-platform-production.up.railway.app/api/workouts | jq .
echo ""

echo "3. Database counts:"
curl -s https://volleyball-trainer-platform-production.up.railway.app/api/debug-counts | jq .
echo ""

echo "📋 To test admin access properly, you need to:"
echo "   1. Log in to https://volleyball-trainer-platform-production.up.railway.app"
echo "   2. Use credentials: kltalsma@gmail.com / password123"
echo "   3. Navigate to /trainings page"
echo "   4. Check browser console for any errors"
echo "   5. Check Network tab to see the /api/workouts response"
