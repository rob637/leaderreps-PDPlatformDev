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
echo -e "${BLUE}[1/15] Checking for rogue Button/Card definitions...${NC}"

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
echo -e "${BLUE}[2/15] Checking for imports from deprecated paths...${NC}"

DEPRECATED_IMPORTS=$(grep -rE "from.*(shared/Button|shared/Card|shared/UI|uiKit|CorporateUI)" src/ --include="*.jsx" 2>/dev/null | wc -l)

if [ "$DEPRECATED_IMPORTS" -gt 0 ]; then
    echo -e "${RED}   ❌ FAIL: Found $DEPRECATED_IMPORTS import(s) from deprecated paths${NC}"
    grep -rE "from.*(shared/Button|shared/Card|shared/UI|uiKit|CorporateUI)" src/ --include="*.jsx" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✅ PASS: No deprecated imports${NC}"
fi

# ============================================================
# CHECK 3: Screen File UI Adoption
# ============================================================
echo -e "${BLUE}[3/15] Checking screen file UI adoption...${NC}"

TOTAL_SCREENS=$(find src/components/screens -name "*.jsx" -type f | wc -l)
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
# CHECK 4: Hardcoded Corporate Colors
# ============================================================
echo -e "${BLUE}[4/15] Checking for hardcoded corporate colors...${NC}"

CORPORATE_HEX=$(grep -rE "(#0B3B5B|#002E47|#47A88D|#219E8B|#E04E1B|#FF6B35|#349881|#FCFCFA)" src/components --include="*.jsx" 2>/dev/null | grep -v "tailwind.config" | grep -v "shared/CorporateUI" | grep -v "ui/uiKit" | wc -l)

if [ "$CORPORATE_HEX" -gt 50 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $CORPORATE_HEX hardcoded corporate hex color(s)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Acceptable hardcoded colors ($CORPORATE_HEX <= 50 threshold)${NC}"
fi

# ============================================================
# CHECK 5: Typography Components
# ============================================================
echo -e "${BLUE}[5/15] Checking Typography component adoption...${NC}"

HEADING_IMPORTS=$(grep -r "Heading.*from.*ui" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)
PAGEHEADER_IMPORTS=$(grep -r "PageHeader.*from.*ui" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)

if [ "$HEADING_IMPORTS" -lt 3 ] && [ "$PAGEHEADER_IMPORTS" -lt 3 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Low Typography adoption (Heading: $HEADING_IMPORTS, PageHeader: $PAGEHEADER_IMPORTS)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Typography components in use${NC}"
fi

# ============================================================
# CHECK 6: Service Layer Compliance
# ============================================================
echo -e "${BLUE}[6/15] Checking service layer compliance...${NC}"

DIRECT_FIREBASE=$(grep -rE "from\s+['\"]firebase" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)

if [ "$DIRECT_FIREBASE" -gt 5 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $DIRECT_FIREBASE direct Firebase imports in screens${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Screens properly use service layer${NC}"
fi

# ============================================================
# CHECK 7: PageLayout Adoption
# ============================================================
echo -e "${BLUE}[7/15] Checking PageLayout adoption...${NC}"

PAGELAYOUT_USAGE=$(grep -r "PageLayout" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)

if [ "$PAGELAYOUT_USAGE" -lt 5 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Low PageLayout adoption ($PAGELAYOUT_USAGE usages)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: PageLayout in use ($PAGELAYOUT_USAGE usages)${NC}"
fi

# ============================================================
# CHECK 8: Rogue StatCard Definitions
# ============================================================
echo -e "${BLUE}[8/15] Checking for rogue StatCard definitions...${NC}"

ROGUE_STATCARDS=$(grep -r "const StatCard\s*=" src/ --include="*.jsx" 2>/dev/null | grep -v "src/components/ui" | wc -l)

if [ "$ROGUE_STATCARDS" -gt 2 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $ROGUE_STATCARDS rogue StatCard definition(s) - use <StatWidget>!${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: StatCard definitions acceptable ($ROGUE_STATCARDS <= 2 legacy)${NC}"
fi

# ============================================================
# CHECK 9: Rogue Loading Components
# ============================================================
echo -e "${BLUE}[9/15] Checking for rogue loading definitions...${NC}"

ROGUE_LOADING=$(grep -rE "const (LoadingSpinner|LoadingOverlay|LoadingIndicator)\s*=" src/ --include="*.jsx" 2>/dev/null | grep -v "src/components/ui" | wc -l)

if [ "$ROGUE_LOADING" -gt 2 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $ROGUE_LOADING rogue loading definitions - use <LoadingState>!${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Loading components canonical ($ROGUE_LOADING <= 2 legacy)${NC}"
fi

# ============================================================
# CHECK 10: WidgetCard Adoption
# ============================================================
echo -e "${BLUE}[10/15] Checking WidgetCard adoption...${NC}"

WIDGETCARD_USAGE=$(grep -r "WidgetCard" src/components --include="*.jsx" 2>/dev/null | wc -l)

if [ "$WIDGETCARD_USAGE" -lt 1 ]; then
    echo -e "${YELLOW}   ⚠️  INFO: WidgetCard not yet adopted - use for dashboard widgets${NC}"
else
    echo -e "${GREEN}   ✅ PASS: WidgetCard in use ($WIDGETCARD_USAGE usages)${NC}"
fi

# ============================================================
# CHECK 11: Rogue Modal Definitions
# ============================================================
echo -e "${BLUE}[11/15] Checking for rogue Modal definitions...${NC}"

# Count inline modal implementations (excluding the canonical Modal component and named modal components)
ROGUE_MODALS=$(grep -rE "fixed inset-0.*(bg-black|bg-opacity|backdrop)" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)

if [ "$ROGUE_MODALS" -gt 5 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $ROGUE_MODALS inline modal implementation(s)${NC}"
    echo -e "${YELLOW}         Use <Modal> from @ui for consistency${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Modal implementations acceptable ($ROGUE_MODALS <= 5)${NC}"
fi

# ============================================================
# CHECK 12: Rogue Table Definitions  
# ============================================================
echo -e "${BLUE}[12/15] Checking for inline table definitions...${NC}"

# Count raw <table> tags (should use DataTable)
INLINE_TABLES=$(grep -r "<table" src/components/screens --include="*.jsx" 2>/dev/null | wc -l)

if [ "$INLINE_TABLES" -gt 5 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $INLINE_TABLES inline <table> implementation(s)${NC}"
    echo -e "${YELLOW}         Consider using <DataTable> from @ui${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Table implementations acceptable ($INLINE_TABLES <= 5)${NC}"
fi

# ============================================================
# CHECK 13: Rogue Tab Implementations
# ============================================================
echo -e "${BLUE}[13/15] Checking for rogue Tab definitions...${NC}"

# Check for inline tab button definitions (not using Tabs component)
ROGUE_TABS=$(grep -rE "const TabButton\s*=" src/ --include="*.jsx" 2>/dev/null | grep -v "src/components/ui" | wc -l)

if [ "$ROGUE_TABS" -gt 1 ]; then
    echo -e "${YELLOW}   ⚠️  WARN: Found $ROGUE_TABS rogue TabButton definition(s)${NC}"
    echo -e "${YELLOW}         Use <Tabs> from @ui for tab interfaces${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ PASS: Tab definitions acceptable ($ROGUE_TABS <= 1 legacy)${NC}"
fi

# ============================================================
# CHECK 14: Filter/Search Patterns
# ============================================================
echo -e "${BLUE}[14/15] Checking Filter component adoption...${NC}"

FILTERBAR_USAGE=$(grep -rE "(FilterBar|FilterSearch|FilterSelect|FilterChips)" src/components --include="*.jsx" 2>/dev/null | grep -v "src/components/ui" | wc -l)

# Not a hard requirement yet, just advisory
echo -e "${GREEN}   ✅ INFO: FilterBar components available for standardized filtering${NC}"

# ============================================================
# CHECK 15: List Component Patterns
# ============================================================
echo -e "${BLUE}[15/15] Checking List component adoption...${NC}"

LISTITEM_USAGE=$(grep -rE "(ListItem|List\s)" src/components --include="*.jsx" 2>/dev/null | grep -v "src/components/ui" | wc -l)

# Not a hard requirement yet, just advisory
echo -e "${GREEN}   ✅ INFO: List/ListItem components available for standardized lists${NC}"

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
