#!/bin/bash
# deploy.sh - Automated Arena PWA deployment script
# Usage: ./deploy.sh "commit message"

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Arena PWA Deployment Script${NC}"
echo "=================================="

# Check if commit message provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a commit message${NC}"
    echo "Usage: ./deploy.sh \"Your commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# 1. Check git status
echo -e "\n${YELLOW}📋 Checking git status...${NC}"
git status --short

# 2. Add all changes
echo -e "\n${YELLOW}➕ Adding all changes...${NC}"
git add .

# 3. Commit with provided message
echo -e "\n${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE" || {
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
}

# 4. Push to GitHub
echo -e "\n${YELLOW}🔄 Pushing to GitHub...${NC}"
git push origin main

# 5. Build production version
echo -e "\n${YELLOW}🏗️  Building production version...${NC}"
npm run build

# 6. Deploy to Firebase
echo -e "\n${YELLOW}🚀 Deploying to Firebase (Hosting & Rules)...${NC}"
firebase deploy --only hosting,firestore:rules

# 7. Success message
echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}🌐 Live at: https://leaderreps-pd-platform.web.app/${NC}"
echo -e "${GREEN}📱 PWA ready for testing${NC}"