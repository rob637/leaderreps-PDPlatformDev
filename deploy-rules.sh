#!/bin/bash
# deploy-rules.sh - Deploy Firestore Security Rules only

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛡️  Deploying Firestore Security Rules...${NC}"
firebase deploy --only firestore:rules

echo -e "${GREEN}✅ Rules Deployed!${NC}"
