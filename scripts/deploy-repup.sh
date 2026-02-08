#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# RepUp Standalone PWA Deployment Script
# 
# USAGE:
#   ./scripts/deploy-repup.sh dev      # Deploy RepUp to DEV
#   ./scripts/deploy-repup.sh test     # Deploy RepUp to TEST
#
# This script deploys the RepUp standalone PWA to its own hosting site.
# The build is shared with the main app - only the hosting target differs.
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
    echo "Usage: ./scripts/deploy-repup.sh <environment>"
    echo ""
    echo "Environments:"
    echo "  dev   - Deploy RepUp to repup-dev.web.app"
    echo "  test  - Deploy RepUp to repup-test.web.app"
    echo ""
    exit 1
fi

ENV=$1

# Environment configuration
case $ENV in
    dev)
        ENV_FILE=".env.dev"
        PROJECT_ID="leaderreps-pd-platform"
        HOSTING_TARGET="repup"
        SITE_ID="repup-dev"
        URL="https://repup-dev.web.app"
        ;;
    test)
        ENV_FILE=".env.test"
        PROJECT_ID="leaderreps-test"
        HOSTING_TARGET="repup"
        SITE_ID="repup-test"
        URL="https://repup-test.web.app"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: $ENV${NC}"
        echo "Valid environments: dev, test"
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
echo -e "${CYAN}  RepUp PWA Deployment${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Environment:  ${YELLOW}$ENV${NC}"
echo -e "  Project ID:   ${BLUE}$PROJECT_ID${NC}"
echo -e "  Site ID:      ${BLUE}$SITE_ID${NC}"
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
    echo -e "${YELLOW}⚠️  You are deploying RepUp to $ENV environment.${NC}"
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

# Step 2: Build (shared build for main app and RepUp)
echo ""
echo -e "${BLUE}🏗️  Step 2: Building application...${NC}"
npm run _build:called-by-deploy-script-only

# Step 3: Verify repup.html exists in build
if [ ! -f "build/repup.html" ]; then
    echo -e "${RED}❌ repup.html not found in build${NC}"
    echo "   Make sure Vite is configured for multi-page build"
    exit 1
fi
echo -e "${GREEN}✓ repup.html found in build${NC}"

# Step 4: Hide index.html so Firebase uses repup.html
# (Firebase serves index.html by default, we need to prevent that)
echo ""
echo -e "${BLUE}🔧 Step 3b: Configuring for RepUp-only deployment...${NC}"
if [ -f "build/index.html" ]; then
    mv "build/index.html" "build/_index.html.bak"
    echo "   Temporarily hid index.html to ensure repup.html is served"
fi
# Also hide diag.html if present
if [ -f "build/diag.html" ]; then
    mv "build/diag.html" "build/_diag.html.bak"
fi

# Step 5: Deploy to RepUp hosting target
echo ""
echo -e "${BLUE}🚀 Step 4: Deploying RepUp to Firebase...${NC}"
firebase deploy --only hosting:$HOSTING_TARGET --project $PROJECT_ID

# Step 6: Restore hidden files
echo ""
echo -e "${BLUE}🔄 Step 5: Restoring build files...${NC}"
if [ -f "build/_index.html.bak" ]; then
    mv "build/_index.html.bak" "build/index.html"
    echo "   Restored index.html"
fi
if [ -f "build/_diag.html.bak" ]; then
    mv "build/_diag.html.bak" "build/diag.html"
fi

# Step 7: Restore dev environment
echo ""
echo -e "${BLUE}🔄 Step 6: Restoring local dev environment...${NC}"
cp .env.dev .env.local
echo "   Restored .env.local to DEV for local development"

# Done
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ RepUp Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Environment:  ${YELLOW}$ENV${NC}"
echo -e "  URL:          ${GREEN}$URL${NC}"
echo ""
echo -e "  ${CYAN}Note: Users can install RepUp as a standalone PWA from:${NC}"
echo -e "        ${GREEN}$URL${NC}"
echo ""
