#!/bin/bash

# LeaderReps DEV Deployment Script
# Usage: ./deploy-dev.sh "Optional Commit Message"

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting DEV Deployment...${NC}"

# 0. UI Architecture Check (Prevents architectural drift)
echo -e "${BLUE}🏛️  Running UI Architecture Check...${NC}"
if [ -f "./scripts/ui-architecture-check.sh" ]; then
    chmod +x ./scripts/ui-architecture-check.sh
    if ! ./scripts/ui-architecture-check.sh; then
        echo -e "${RED}❌ Deployment blocked: UI architecture violations detected.${NC}"
        echo -e "${RED}   Fix the issues above before deploying.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  UI architecture check script not found, skipping...${NC}"
fi

# 1. Handle Git (Commit & Push)
if [ -n "$(git status --porcelain)" ]; then
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Error: You have uncommitted changes.${NC}"
        echo "Please provide a commit message to deploy: ./deploy-dev.sh \"message\""
        exit 1
    else
        echo -e "${YELLOW}📦 Committing changes...${NC}"
        git add .
        git commit -m "$1"
    fi
fi

echo -e "${YELLOW}⬆️  Pushing to remote...${NC}"
git push origin $(git rev-parse --abbrev-ref HEAD)

# 2. Build
echo -e "${BLUE}🏗️  Building for DEV...${NC}"
cp .env.dev .env.local
# Inject secrets if they exist
if [ -f .env.secrets ]; then
    cat .env.secrets >> .env.local
fi
npm run build

# 3. Deploy
echo -e "${BLUE}🔥 Deploying to Firebase (DEV)...${NC}"
firebase use dev
firebase deploy --only hosting,firestore

echo -e "${GREEN}✅ DEV Deployment Complete!${NC}"
