#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# LeaderReps Production Setup Verification Script
# 
# USAGE:
#   ./scripts/verify-prod-setup.sh
#
# This script checks if all prerequisites for production deployment are met.
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

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  LeaderReps Production Setup Verification${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

WARNINGS=0
ERRORS=0

# Helper functions
check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. Check environment files
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}📁 Environment Files${NC}"

if [ -f ".env.prod" ]; then
    check_pass ".env.prod exists"
    
    # Verify it has the correct project ID
    if grep -q "leaderreps-prod" .env.prod; then
        check_pass ".env.prod contains correct project ID"
    else
        check_fail ".env.prod does not contain leaderreps-prod"
    fi
    
    # Check for placeholder API key
    if grep -q "your-gemini-api-key-here" .env.prod; then
        check_warn ".env.prod has placeholder Gemini API key (update before go-live)"
    else
        check_pass ".env.prod has Gemini API key configured"
    fi
else
    check_fail ".env.prod does not exist"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 2. Check Firebase configuration
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}🔥 Firebase Configuration${NC}"

if grep -q '"prod": "leaderreps-prod"' .firebaserc; then
    check_pass ".firebaserc has prod project alias"
else
    check_fail ".firebaserc missing prod project alias"
fi

if grep -q '"site": "leaderreps-prod"' firebase.json; then
    check_pass "firebase.json has leaderreps-prod hosting site"
else
    check_fail "firebase.json missing leaderreps-prod hosting site"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 3. Check admin SDK files
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}🔑 Admin SDK Files${NC}"

if [ -f "leaderreps-pd-platform-firebase-adminsdk.json" ]; then
    check_pass "Dev admin SDK key exists"
else
    check_warn "Dev admin SDK key missing (needed for data export)"
fi

if [ -f "leaderreps-test-firebase-adminsdk.json" ]; then
    check_pass "Test admin SDK key exists"
else
    check_warn "Test admin SDK key missing"
fi

if [ -f "leaderreps-prod-firebase-adminsdk.json" ]; then
    check_pass "Prod admin SDK key exists"
else
    check_fail "Prod admin SDK key missing - generate from Firebase Console"
    echo -e "       ${YELLOW}→ Go to: https://console.firebase.google.com/project/leaderreps-prod/settings/serviceaccounts/adminsdk${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 4. Check npm scripts
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}📜 NPM Scripts${NC}"

if grep -q '"deploy:prod"' package.json; then
    check_pass "deploy:prod script exists in package.json"
else
    check_fail "deploy:prod script missing from package.json"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 5. Check Firebase CLI authentication
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}🔐 Firebase CLI${NC}"

if firebase projects:list &> /dev/null; then
    check_pass "Firebase CLI authenticated"
    
    # Check if prod project is accessible
    if firebase projects:list | grep -q "leaderreps-prod"; then
        check_pass "leaderreps-prod project accessible"
    else
        check_fail "leaderreps-prod project not accessible (check permissions)"
    fi
else
    check_warn "Firebase CLI not authenticated (run: firebase login)"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 6. Check Cloud Functions
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}⚡ Cloud Functions${NC}"

if [ -d "functions" ] && [ -f "functions/index.js" ]; then
    check_pass "Functions directory exists"
    
    if [ -d "functions/node_modules" ]; then
        check_pass "Functions dependencies installed"
    else
        check_warn "Functions dependencies not installed (run: npm --prefix functions install)"
    fi
else
    check_fail "Functions directory or index.js missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 7. Summary
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for production deployment.${NC}"
    echo ""
    echo -e "Run: ${CYAN}npm run deploy:prod${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s). Production deployment possible but review warnings.${NC}"
    echo ""
    echo -e "Run: ${CYAN}npm run deploy:prod${NC}"
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s). Fix errors before deploying.${NC}"
    echo ""
    echo "See PRODUCTION-CHECKLIST.md for setup instructions."
fi

echo ""
exit $ERRORS
