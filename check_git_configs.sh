#!/bin/bash

echo "=== Git Configuration Check ==="
echo ""

echo "🌍 Global Git Configuration:"
echo "Name: $(git config --global user.name)"
echo "Email: $(git config --global user.email)"
echo ""

echo "📁 ~/Prive directory Git configuration:"
if [ -d "/Users/kltalsma/Prive" ]; then
    cd /Users/kltalsma/Prive
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Name: $(git config user.name || echo 'Not set (using global)')"
        echo "Email: $(git config user.email || echo 'Not set (using global)')"
    else
        echo "No Git repository found"
    fi
else
    echo "Directory does not exist"
fi
echo ""

echo "💼 ~/Wehkamp/github directory Git configuration:"
if [ -d "/Users/kltalsma/Wehkamp/github" ]; then
    cd /Users/kltalsma/Wehkamp/github
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Name: $(git config user.name || echo 'Not set (using global)')"
        echo "Email: $(git config user.email || echo 'Not set (using global)')"
    else
        echo "No Git repository found in this directory"
        echo "Checking subdirectories for Git repositories..."
        find . -maxdepth 2 -name ".git" -type d | while read gitdir; do
            repo_dir=$(dirname "$gitdir")
            echo "  Repository found in: $repo_dir"
            cd "$repo_dir"
            echo "    Name: $(git config user.name || echo 'Not set (using global)')"
            echo "    Email: $(git config user.email || echo 'Not set (using global)')"
            cd - > /dev/null
        done
    fi
else
    echo "Directory does not exist"
fi
echo ""

echo "📍 Current directory ($(pwd)) Git configuration:"
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Name: $(git config user.name || echo 'Not set (using global)')"
    echo "Email: $(git config user.email || echo 'Not set (using global)')"
else
    echo "No Git repository found"
fi