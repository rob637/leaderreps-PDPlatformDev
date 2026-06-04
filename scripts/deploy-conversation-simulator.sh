#!/bin/bash
# Deploy the Conversation Simulator (LeaderReps Lab — Internal Prototype)
# to its dedicated Firebase Hosting site.
#
# Usage:
#   ./scripts/deploy-conversation-simulator.sh dev
#
# Phase 0/2: dev only. Admin-only access via Firebase Auth + mintSimulatorToken
# Cloud Function (must already be deployed). Test and prod targets intentionally
# not wired yet — uncomment the cases below when those sites exist.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENV=$1
if [ -z "$ENV" ]; then
    echo -e "${RED}Usage: ./scripts/deploy-conversation-simulator.sh <dev>${NC}"
    exit 1
fi

case $ENV in
    dev)
        PROJECT_ID="leaderreps-pd-platform"
        SITE_ID="leaderreps-conversation-simulator"
        ;;
    test|prod)
        echo -e "${RED}Simulator is dev-only right now. Add a site in firebase.json + this script when ready.${NC}"
        exit 1
        ;;
    *)
        echo -e "${RED}Unknown env: $ENV${NC}"
        exit 1
        ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_ROOT/conversation-simulator"

if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}⚠  conversation-simulator/.env not found.${NC}"
    echo -e "    Copy .env.example to .env and fill in the dev Firebase config before deploying."
    exit 1
fi

echo -e "${CYAN}→ Building conversation-simulator...${NC}"
cd "$APP_DIR"
npm run build

echo -e "${CYAN}→ Deploying to project=${PROJECT_ID} site=${SITE_ID}...${NC}"
cd "$PROJECT_ROOT"
firebase deploy \
    --only "hosting:${SITE_ID},functions:mintSimulatorToken" \
    --project "$PROJECT_ID"

echo -e "${GREEN}✓ Conversation Simulator deployed:${NC} https://${SITE_ID}.web.app"
