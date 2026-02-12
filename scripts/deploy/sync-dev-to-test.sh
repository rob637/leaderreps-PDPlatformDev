#!/bin/bash

# Syncs Code AND Application Data from Dev to Test
# Usage: ./sync-dev-to-test.sh "Commit Message"

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Starting Full Sync (Dev -> Test)...${NC}"

# 1. Deploy Code (Builds, Commits, Pushes, Deploys Hosting/Rules)
# Pass the commit message argument to deploy-test.sh
./deploy-test.sh "$1"

# 2. Migrate Data
echo -e "\n${BLUE}📦 Starting Data Migration...${NC}"

# Export from Dev
echo -e "${YELLOW}   Exporting from Dev...${NC}"
npm run data:export dev

# Find the most recent export file
# We look for files matching the pattern, sort by time (newest first), and take the top one
LATEST_EXPORT=$(ls -t data-exports/app-data-dev-*.json 2>/dev/null | head -n 1)

if [ -z "$LATEST_EXPORT" ]; then
    echo -e "${RED}❌ Error: No export file found after export step.${NC}"
    exit 1
fi

echo -e "${GREEN}   Found latest export: $LATEST_EXPORT${NC}"

# Import to Test
echo -e "${YELLOW}   Importing to Test...${NC}"
npm run data:import test "$LATEST_EXPORT"

echo -e "\n${GREEN}✅ Full Sync Complete! (Code + Data)${NC}"
