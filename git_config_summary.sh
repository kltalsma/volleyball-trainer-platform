#!/bin/bash

echo "=== Git Configuration Summary ==="
echo ""

echo "🌍 Global Git Configuration:"
echo "Name: $(git config --global user.name)"
echo "Email: $(git config --global user.email)"
echo ""

echo "📍 Current Project (volleyball-trainer-platform):"
echo "Name: $(git config user.name)"
echo "Email: $(git config user.email)"
echo ""

echo "📁 Checking other repositories..."
echo ""

# Function to check git config in a directory
check_git_config() {
    local dir="$1"
    local label="$2"
    
    if [ -d "$dir" ] && [ -d "$dir/.git" ]; then
        cd "$dir" 2>/dev/null
        local name=$(git config user.name 2>/dev/null)
        local email=$(git config user.email 2>/dev/null)
        
        echo "$label:"
        echo "  Name: ${name:-'Not set (using global)'}"
        echo "  Email: ${email:-'Not set (using global)'}"
        echo ""
        
        cd - >/dev/null 2>&1
    fi
}

# Check some known repositories
check_git_config "/Users/kltalsma/Prive/nl-car-tracker" "🚗 nl-car-tracker (Personal)"
check_git_config "/Users/kltalsma/Wehkamp/github" "💼 Wehkamp github (Work)"
check_git_config "/Users/kltalsma/Wehkamp/github/provisioner-service" "💼 provisioner-service (Work)"
check_git_config "/Users/kltalsma/Wehkamp/github/atlas-basket-service" "💼 atlas-basket-service (Work)"

echo "💡 Summary:"
echo "Your global Git configuration is set to work email (ktalsma@wehkamp.nl)"
echo "But this volleyball project is configured for personal email (kltalsma@gmail.com)"
echo ""
echo "This is the correct setup for separating work and personal projects!"