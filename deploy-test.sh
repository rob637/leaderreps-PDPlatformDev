#!/bin/bash
# deploy-test.sh - Automated deployment script for TEST environment
# Usage: ./deploy-test.sh "commit message"

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 LeaderReps TEST Environment Deployment${NC}"
echo "==========================================="

# Check if commit message provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a commit message${NC}"
    echo "Usage: ./deploy-test.sh \"Your commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# 1. Check git status
echo -e "\n${YELLOW}📋 Checking git status...${NC}"
git status --short

# 2. Switch to test Firebase project
echo -e "\n${YELLOW}🔄 Switching to TEST Firebase project...${NC}"
firebase use test

# 3. Build with test environment (BEFORE committing)
echo -e "\n${YELLOW}🏗️  Building for TEST environment...${NC}"
cp .env.test .env.local
npm run build

# 4. If build succeeds, proceed with git operations
echo -e "\n${YELLOW}➕ Adding all changes...${NC}"
git add .

# 5. Commit with provided message
echo -e "\n${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE" || {
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
}

# 6. Push to GitHub
echo -e "\n${YELLOW}🔄 Pushing to GitHub...${NC}"
git push origin main

# 7. Deploy to Firebase Test
echo -e "\n${YELLOW}🚀 Deploying to Firebase Test Hosting...${NC}"
firebase deploy --only hosting

# 8. Deploy Firestore rules and indexes
echo -e "\n${YELLOW}🔐 Deploying Firestore rules and indexes...${NC}"
firebase deploy --only firestore

# 9. Switch back to default project
firebase use default

# 10. Clean up
rm -f .env.local

# 11. Success message
echo -e "\n${GREEN}✅ TEST Deployment Complete!${NC}"
echo -e "${GREEN}🌐 Live at: https://leaderreps-test.web.app/${NC}"
echo -e "${GREEN}📱 Test environment ready for QA${NC}"
