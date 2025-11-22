#!/bin/bash

# Ensure a commit message is provided
if [ -z "$1" ]; then
  echo "Error: Please provide a commit message."
  echo "Usage: ./commit-merge-dev.sh \"Your commit message\""
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "Error: You are already on main. This script merges a feature branch INTO main."
  exit 1
fi

echo "==============================================="
echo "MERGE & CLEANUP: $CURRENT_BRANCH -> main"
echo "==============================================="

# 1. Add and Commit
echo "Step 1: Committing changes..."
git add .
git commit -m "$1"

# 2. Checkout Main and Pull
echo "Step 2: Switching to main and updating..."
git checkout main
git pull origin main

# 3. Merge
echo "Step 3: Merging $CURRENT_BRANCH into main..."
git merge "$CURRENT_BRANCH"

# 4. Push
echo "Step 4: Pushing to origin/main..."
git push origin main

# 5. Delete Branch
echo "Step 5: Deleting local branch $CURRENT_BRANCH..."
git branch -d "$CURRENT_BRANCH"

echo "==============================================="
echo "SUCCESS! Branch merged and deleted."
echo "==============================================="
