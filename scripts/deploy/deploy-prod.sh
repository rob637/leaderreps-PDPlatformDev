#!/bin/bash

# LeaderReps PRODUCTION Deployment Script
# Usage: ./deploy-prod.sh
#
# NOTE: This script is a convenience wrapper around the unified deploy.sh script.
# For production deployments, you MUST type 'DEPLOY PROD' to confirm.
#
# ⚠️  WARNING: This deploys to the LIVE production environment!

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║            ⚠️  PRODUCTION DEPLOYMENT                          ║${NC}"
echo -e "${RED}║                                                               ║${NC}"
echo -e "${RED}║  You are about to deploy to the LIVE production environment  ║${NC}"
echo -e "${RED}║  This action affects real users!                             ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Call the unified deploy script
exec bash "$PROJECT_ROOT/scripts/deploy.sh" prod
