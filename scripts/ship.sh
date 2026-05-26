#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# LeaderReps Ship — solo-dev workflow
#
# Usage:
#   npm run ship              # commit (if needed) → push main → deploy:prod
#   npm run ship "msg"        # uses provided commit message
#
# What it does:
#   1. Auto-stages and commits any uncommitted changes (prompts for message if
#      not provided as an argument)
#   2. Pushes main to origin
#   3. Runs deploy:prod (which still requires the typed "DEPLOY PROD" confirm)
# ═══════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Must be on main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo -e "${RED}❌ Not on main (currently on '$BRANCH').${NC}"
    echo "   git checkout main && git merge --ff-only $BRANCH"
    exit 1
fi

# Pull first
echo -e "${BLUE}📥 Pulling latest main…${NC}"
git pull --ff-only origin main

# Auto-commit any uncommitted work
if [ -n "$(git status --porcelain)" ]; then
    MSG="${1:-}"
    if [ -z "$MSG" ]; then
        echo ""
        echo -e "${YELLOW}Uncommitted changes detected:${NC}"
        git status --short
        echo ""
        read -p "Commit message: " MSG
        if [ -z "$MSG" ]; then
            echo "Aborted (empty message)."
            exit 1
        fi
    fi
    git add -A
    git commit -m "$MSG"
    echo -e "${GREEN}✓ Committed${NC}"
fi

# Push
echo ""
echo -e "${BLUE}🚀 Pushing main…${NC}"
git push origin main

# Deploy
echo ""
echo -e "${BLUE}📦 Deploying to prod…${NC}"
bash ./scripts/deploy.sh prod

echo ""
echo -e "${GREEN}✅ Shipped.${NC}"
