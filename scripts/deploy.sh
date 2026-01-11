#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# LeaderReps Unified Deployment Script
# 
# USAGE:
#   ./scripts/deploy.sh dev      # Deploy to DEV
#   ./scripts/deploy.sh test     # Deploy to TEST
#   ./scripts/deploy.sh prod     # Deploy to PROD (requires confirmation)
#
# This script ensures the correct .env file is used for each environment.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Validate argument
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Environment not specified${NC}"
    echo ""
    echo "Usage: ./scripts/deploy.sh <environment>"
    echo ""
    echo "Environments:"
    echo "  dev   - Deploy to leaderreps-pd-platform (Development)"
    echo "  test  - Deploy to leaderreps-test (Testing/QA)"
    echo "  prod  - Deploy to leaderreps-prod (Production) - NOT YET CONFIGURED"
    echo ""
    exit 1
fi

ENV=$1

# Environment configuration
case $ENV in
    dev)
        ENV_FILE=".env.dev"
        PROJECT_ID="leaderreps-pd-platform"
        HOSTING_TARGET="leaderreps-pd-platform"
        URL="https://leaderreps-pd-platform.web.app"
        ;;
    test)
        ENV_FILE=".env.test"
        PROJECT_ID="leaderreps-test"
        HOSTING_TARGET="leaderreps-test"
        URL="https://leaderreps-test.web.app"
        ;;
    prod)
        echo -e "${RED}❌ PROD deployment not yet configured.${NC}"
        exit 1
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: $ENV${NC}"
        echo "Valid environments: dev, test, prod"
        exit 1
        ;;
esac

# Check env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  LeaderReps Deployment${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Environment:  ${YELLOW}$ENV${NC}"
echo -e "  Project ID:   ${BLUE}$PROJECT_ID${NC}"
echo -e "  URL:          ${GREEN}$URL${NC}"
echo -e "  Env File:     $ENV_FILE"
echo ""

# Extract project ID from env file to verify
ENV_PROJECT_ID=$(grep "VITE_FIREBASE_PROJECT_ID=" "$ENV_FILE" | cut -d'=' -f2)
if [ "$ENV_PROJECT_ID" != "$PROJECT_ID" ]; then
    echo -e "${RED}❌ CRITICAL: Project ID mismatch!${NC}"
    echo "   Expected: $PROJECT_ID"
    echo "   Found in $ENV_FILE: $ENV_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Environment file verified${NC}"
echo ""

# Confirmation for non-dev
if [ "$ENV" != "dev" ]; then
    echo -e "${YELLOW}⚠️  You are deploying to $ENV environment.${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

# Step 1: Copy environment file
echo -e "${BLUE}📋 Step 1: Setting environment...${NC}"
cp "$ENV_FILE" .env.local
echo "   Copied $ENV_FILE → .env.local"

# Append secrets if they exist
if [ -f ".env.secrets" ]; then
    cat .env.secrets >> .env.local
    echo "   Appended .env.secrets"
fi

# Step 2: Build
echo ""
echo -e "${BLUE}🏗️  Step 2: Building application...${NC}"
npm run build

# Step 3: Verify build has correct project ID
BUILD_ENV_CHECK=$(grep -o "leaderreps-[a-z-]*" build/assets/*.js 2>/dev/null | head -1 || echo "")
if [[ "$BUILD_ENV_CHECK" != *"$PROJECT_ID"* ]] && [ -n "$BUILD_ENV_CHECK" ]; then
    echo -e "${YELLOW}⚠️  Warning: Build may contain different project reference${NC}"
fi

# Step 4: Deploy
echo ""
echo -e "${BLUE}🚀 Step 3: Deploying to Firebase...${NC}"
firebase deploy --only hosting:$HOSTING_TARGET --project $PROJECT_ID

# Step 5: Restore dev environment (for local development)
echo ""
echo -e "${BLUE}🔄 Step 4: Restoring local dev environment...${NC}"
cp .env.dev .env.local
echo "   Restored .env.local to DEV for local development"

# Done
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Environment:  ${YELLOW}$ENV${NC}"
echo -e "  URL:          ${GREEN}$URL${NC}"
echo ""
