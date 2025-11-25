#!/bin/bash

# ============================================================
# UI Architecture Enforcement Script
# ============================================================
# This script validates that new code follows the World Class
# UI architecture standards before deployment.
#
# Run manually: ./scripts/ui-architecture-check.sh
# Integrated into: deploy-dev.sh, deploy-test.sh
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🏛️  UI ARCHITECTURE ENFORCEMENT CHECK               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# ============================================================
# CHECK 1: No Duplicate Button/Card Definitions
# ============================================================
echo -e "${BLUE}[1/10] Checking for rogue Button/Card definitions...${NC}"

# Exclude legacy files that are deprecated but not yet removed:
# - src/components/shared/CorporateUI.jsx (deprecated, not imported)
# - src/ui/uiKit.jsx (deprecated, not imported)
ROGUE_BUTTONS=$(grep -r "const Button\s*=" src/ --include="*.jsx" | grep -v "src/components/ui" | grep -v "shared/CorporateUI" | grep -v "ui/uiKit" | wc -l)
ROGUE_CARDS=$(grep -r "const Card\s*=" src/ --include="*.jsx" | grep -v "src/components/ui" | grep -v "shared/CorporateUI" | grep -v "ui/uiKit" | wc -l)

if [ "$ROGUE_BUTTONS" -gt 0 ]; then
    echo -e "${RED}   ❌ FAIL: Found $ROGUE_BUTTONS rogue Button definition(s)${NC}"
    grep -r "const Button\s*=" src/ --include="*.jsx" | grep -v "src/components/ui" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✅ PASS: No rogue Button definitions${NC}"
fi

if [ "$ROGUE_CARDS" -gt 0 ]; then
    echo -e "${RED}   ❌ FAIL: Found $ROGUE_CARDS rogue Card definition(s)${NC}"
    grep -r "const Card\s*=" src/ --include="*.jsx" | grep -v "src/components/ui" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✅ PASS: No rogue Card definitions${NC}"
fi

# ============================================================
# CHECK 2: No Imports from Deprecated Paths
# ============================================================
echo -e "${BLUE}[2/10] Checking for imports from deprecated paths...${NC}"

DEPRECATED_IMPORTS=$(grep -rE "from.*(shared/Button|shared/Card|shared/UI|uiKit|CorporateUI)" src/ --include="*.jsx" 2>/dev/null | wc -l)

if [ "$DEPRECATED_IMPORTS" -gt 0 ]; then
    echo -e "${RED}   ❌ FAIL: Found $DEPRECATED_IMPORTS import(s) from deprecated paths${NC}"
    grep -rE "from.*(shared/Button|shared/Card|shared/UI|uiKit|CorporateUI)" src/ --include="*.jsx" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✅ PASS: No deprecated imports${NC}"
fi

# ============================================================
# CHECK 3: New Screen Files Must Import from @ui
# ============================================================
echo -e "${BLUE}[3/10] Checking screen file UI adoption...${NC}"

TOTAL_SCREENS=$(find src/components/screens -name "*.jsx" -type f | wc -l)

# Count files that either:
# 1. Import directly from @ui (from.*ui)
# 2. Import from wrapper files that re-export from @ui (DevPlanComponents, DashboardComponents, LabComponents)
# 3. Are utility files (Hooks, Utils) that don't need UI imports
SCREENS_WITH_UI=$(find src/components/screens -name "*.jsx" -type f -exec grep -lE "from.*(ui|DevPlanComponents|DashboardComponents|LabComponents)" {} + 2>/dev/null | wc -l)
UTILITY_FILES=$(find src/components/screens -name "*Hooks.jsx" -o -name "*Utils.jsx" -o -name "*utils.jsx" 2>/dev/null | wc -l)
EFFECTIVE_TOTAL=$((TOTAL_SCREENS - UTILITY_FILES))
ADOPTION_RATE=$((SCREENS_WITH_UI * 100 / EFFECTIVE_TOTAL))

if [ "$ADOPTION_RATE" -lt 70 ]; then
    echo -e "${RED}   ❌ FAIL: UI adoption rate is ${ADOPTION_RATE}% (minimum: 70%)${NC}"
    ERRORS=$((ERRORS + 1))
elif [ "$ADOPTION_RATE" -lt 85 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: UI adoption rate is ${ADOPTION_RATE}% (target: 85%+)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: UI adoption rate is ${ADOPTION_RATE}% (${SCREENS_WITH_UI}/${EFFECTIVE_TOTAL} screens)${NC}"
fi

# ============================================================
# CHECK 4: No Hardcoded Corporate Hex Colors in New Files
# ============================================================
echo -e "${BLUE}[4/10] Checking for hardcoded corporate colors...${NC}"

# Corporate colors that should use Tailwind classes or CSS variables
# Excludes legacy/deprecated files from count
CORPORATE_HEX=$(grep -rE "(#0B3B5B|#002E47|#47A88D|#219E8B|#E04E1B|#FF6B35|#349881|#FCFCFA)" src/components --include="*.jsx" 2>/dev/null | grep -v "tailwind.config" | grep -v "shared/CorporateUI" | grep -v "ui/uiKit" | wc -l)

if [ "$CORPORATE_HEX" -gt 50 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $CORPORATE_HEX hardcoded corporate hex color(s)${NC}"
    echo -e "${YELLOW}         Use Tailwind classes: text-corporate-navy, bg-corporate-teal, etc.${NC}"
    echo -e "${YELLOW}         Or CSS variables: var(--corporate-navy), var(--corporate-teal), etc.${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Acceptable hardcoded colors ($CORPORATE_HEX <= 50 threshold)${NC}"
fi

# ============================================================
# CHECK 5: Typography Components Usage (Advisory)
# ============================================================
echo -e "${BLUE}[5/10] Checking Typography component adoption...${NC}"

HEADING_IMPORTS=$(grep -r "Heading.*from.*ui" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)
PAGEHEADER_IMPORTS=$(grep -r "PageHeader.*from.*ui" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)

if [ "$HEADING_IMPORTS" -lt 3 ] && [ "$PAGEHEADER_IMPORTS" -lt 3 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Low Typography adoption (Heading: $HEADING_IMPORTS, PageHeader: $PAGEHEADER_IMPORTS)${NC}"
    echo -e "${YELLOW}         Consider using <Heading> and <PageHeader> from @ui${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Typography components in use${NC}"
fi

# ============================================================
# CHECK 6: Service Layer Compliance
# ============================================================
echo -e "${BLUE}[6/10] Checking service layer compliance...${NC}"

# Check for direct Firebase imports in screen files (should use hooks/services)
DIRECT_FIREBASE=$(grep -rE "from\s+['\"]firebase" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)

if [ "$DIRECT_FIREBASE" -gt 5 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $DIRECT_FIREBASE direct Firebase imports in screens${NC}"
    echo -e "${YELLOW}         Screens should use hooks (useAppServices) not direct Firebase${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Screens properly use service layer${NC}"
fi

# ============================================================
# CHECK 7: PageLayout Adoption
# ============================================================
echo -e "${BLUE}[7/10] Checking PageLayout adoption...${NC}"

# Count screens using PageLayout (directly or via import)
PAGELAYOUT_USAGE=$(grep -r "PageLayout" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)
# Target: main screens should use PageLayout for consistent header/nav

if [ "$PAGELAYOUT_USAGE" -lt 5 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Low PageLayout adoption ($PAGELAYOUT_USAGE usages)${NC}"
    echo -e "${YELLOW}         Use <PageLayout> for consistent page headers and navigation${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: PageLayout in use ($PAGELAYOUT_USAGE usages)${NC}"
fi

# ============================================================
# CHECK 8: Rogue StatCard Definitions
# ============================================================
echo -e "${BLUE}[8/10] Checking for rogue StatCard definitions...${NC}"

# StatWidget is the canonical stat display component
# Exclude known legacy files and the canonical definition
ROGUE_STATCARDS=$(grep -r "const StatCard\s*=" src/ --include="*.jsx" 2>/dev/null | grep -v "src/components/ui" | wc -l)

if [ "$ROGUE_STATCARDS" -gt 2 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $ROGUE_STATCARDS rogue StatCard definition(s)${NC}"
    echo -e "${YELLOW}         Use <StatWidget> from @ui for stat displays${NC}"
    grep -r "const StatCard\s*=" src/ --include="*.jsx" | grep -v "src/components/ui" | head -3
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: StatCard definitions acceptable ($ROGUE_STATCARDS <= 2 legacy)${NC}"
fi

# ============================================================
# CHECK 9: Rogue Loading State Definitions
# ============================================================
echo -e "${BLUE}[9/10] Checking for rogue loading state definitions...${NC}"

# LoadingState/LoadingSpinner are the canonical loading components
ROGUE_LOADING=$(grep -rE "const (LoadingSpinner|LoadingOverlay|LoadingIndicator)\s*=" src/ --include="*.jsx" 2>/dev/null | grep -v "src/components/ui" | wc -l)

if [ "$ROGUE_LOADING" -gt 2 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $ROGUE_LOADING rogue loading component definition(s)${NC}"
    echo -e "${YELLOW}         Use <LoadingState> or <LoadingSpinner> from @ui${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Loading components canonical ($ROGUE_LOADING <= 2 legacy)${NC}"
fi

# ============================================================
# CHECK 10: WidgetCard Adoption (Advisory)
# ============================================================
echo -e "${BLUE}[10/10] Checking WidgetCard adoption...${NC}"

# Check for WidgetCard usage in dashboard/widget areas
WIDGETCARD_USAGE=$(grep -r "WidgetCard" src/components --include="*.jsx" 2>/dev/null | wc -l)

if [ "$WIDGETCARD_USAGE" -lt 1 ]; then
    echo -e "${YELLOW}   ⚠️  INFO: WidgetCard not yet adopted${NC}"
    echo -e "${YELLOW}         New widget components should use <WidgetCard> from @ui${NC}"
    # Not a warning yet since it's new - just advisory
else
    echo -e "${GREEN}   ✅ PASS: WidgetCard in use ($WIDGETCARD_USAGE usages)${NC}"
fi

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}❌ ARCHITECTURE CHECK FAILED${NC}"
    echo -e "${RED}   $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "${RED}   Please fix the errors above before deploying.${NC}"
    echo -e "${RED}   See: LAYOUT-STANDARDS.md for guidelines.${NC}"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ARCHITECTURE CHECK PASSED WITH WARNINGS${NC}"
    echo -e "${YELLOW}   0 errors, $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "${YELLOW}   Consider addressing warnings for best practices.${NC}"
    exit 0
else
    echo -e "${GREEN}✅ ARCHITECTURE CHECK PASSED${NC}"
    echo -e "${GREEN}   World Class UI standards maintained!${NC}"
    exit 0
fi
