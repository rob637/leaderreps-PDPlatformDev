#!/bin/bash
# Deploy the Kudos consumer sub-app to its dedicated hosting site.
#
# Usage:
#   ./scripts/deploy-kudos.sh dev
#   ./scripts/deploy-kudos.sh prod
#
# Builds kudos/dist and deploys to the leaderreps-kudos hosting site on the
# matching Firebase project. Site IDs are environment-specific (we expect
# one site per env; create them in the Firebase console if missing).

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

ENV=$1
if [ -z "$ENV" ]; then
    echo -e "${RED}Usage: ./scripts/deploy-kudos.sh <dev|test|prod>${NC}"
    exit 1
fi

case $ENV in
    dev)
        PROJECT_ID="leaderreps-pd-platform"
        SITE_ID="leaderreps-kudos"
        ;;
    test)
        PROJECT_ID="leaderreps-test"
        SITE_ID="leaderreps-kudos-test"
        ;;
    prod)
        PROJECT_ID="leaderreps-prod"
        SITE_ID="leaderreps-kudos-prod"
        ;;
    *)
        echo -e "${RED}Unknown env: $ENV${NC}"
        exit 1
        ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/kudos"

echo -e "${CYAN}→ Building kudos sub-app...${NC}"
npm run build

echo -e "${CYAN}→ Deploying to project=${PROJECT_ID} site=${SITE_ID}...${NC}"
cd "$PROJECT_ROOT"
firebase deploy \
    --only "hosting:${SITE_ID}" \
    --project "$PROJECT_ID"

echo -e "${GREEN}✓ Kudos deployed.${NC}"
