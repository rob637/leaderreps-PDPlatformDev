// Industry benchmarks and ROI calculation logic
// Sources: Gallup, SHRM, Brandon Hall Group, McKinsey, Harvard Business Review
//
// DESIGN NOTES (post-call refactor, May 2026):
// - This calculator is an EDUCATIONAL tool, not a sales projection engine.
// - We deliberately frame ROI through "verbal ROI" scenarios — small, conservative,
//   and easy for a skeptical CFO to defend — rather than aggregated savings totals.
// - Anchor metaphor: Maxwell's "Law of the Lid". Better leaders raise capacity;
//   they don't (primarily) reduce headcount. Frame growth, not cuts.
// - Default scope is ONE leader and ONE direct report. Optional scaling is allowed
//   but the headline always shows the per-leader picture.

/**
 * Industry benchmarks for turnover rates.
 * Replacement-cost is now keyed off ROLE LEVEL (see ROLE_REPLACEMENT_COST), not industry.
 * Source: BLS, SHRM 2023-2024.
 */
export const INDUSTRY_BENCHMARKS = {
  technology: { name: 'Technology & Software', avgTurnover: 13.2, icon: '💻' },
  healthcare: { name: 'Healthcare', avgTurnover: 19.5, icon: '🏥' },
  finance: { name: 'Financial Services', avgTurnover: 12.8, icon: '💰' },
  manufacturing: { name: 'Manufacturing', avgTurnover: 28.6, icon: '🏭' },
  retail: { name: 'Retail & Consumer', avgTurnover: 60.5, icon: '🛒' },
  professional_services: { name: 'Professional Services', avgTurnover: 14.2, icon: '📊' },
  education: { name: 'Education', avgTurnover: 16.1, icon: '🎓' },
  government: { name: 'Government & Public Sector', avgTurnover: 8.4, icon: '🏛️' },
  hospitality: { name: 'Hospitality & Food Service', avgTurnover: 73.8, icon: '🏨' },
  other: { name: 'Other', avgTurnover: 15.0, icon: '🏢' },
};

/**
 * Replacement cost as a fraction of the departing person's annual salary.
 * These are the conservative end of widely-cited ranges (SHRM, CAP, Work Institute).
 *
 *   Entry / hourly       30-50%   → use 35%
 *   Mid-level individual 50-75%   → use 50%
 *   Manager / specialist 100-150% → use 100%
 *   Executive            150-200% → use 150%
 */
export const ROLE_REPLACEMENT_COST = {
  entry:      { label: 'Entry / hourly',     pct: 0.35 },
  mid:        { label: 'Mid-level',          pct: 0.50 },
  manager:    { label: 'Manager / senior',   pct: 1.00 },
  executive:  { label: 'Executive',          pct: 1.50 },
};

/**
 * Departments. Each one shapes the "third scenario" on the Results page and
 * controls whether we ask the user for an average deal size (sales only).
 *
 * regrettedBaseline = the attrition rate (%) commonly considered "healthy" for
 * leaders in this department. Anchored to the tech-industry rule of thumb that
 * regretted attrition under ~5% is healthy and 8-10%+ is problematic. Adjusted
 * by function based on widely-cited industry reports.
 */
export const DEPARTMENTS = {
  sales: {
    name: 'Sales',
    icon: '💼',
    regrettedBaseline: 7,    // sales tolerates higher churn but regretted >7% hurts
    askDealValue: true,
    thirdScenario: 'one-more-deal',
  },
  marketing: {
    name: 'Marketing',
    icon: '📣',
    regrettedBaseline: 5,
    askDealValue: false,
    thirdScenario: 'better-hire',
  },
  product: {
    name: 'Product',
    icon: '🧩',
    regrettedBaseline: 4,
    askDealValue: false,
    thirdScenario: 'ship-initiative',
  },
  engineering: {
    name: 'Engineering',
    icon: '⚙️',
    regrettedBaseline: 4,
    askDealValue: false,
    thirdScenario: 'ship-initiative',
  },
  customer_success: {
    name: 'Customer Success',
    icon: '🤝',
    regrettedBaseline: 6,
    askDealValue: false,
    thirdScenario: 'retain-account',
  },
  operations: {
    name: 'Operations',
    icon: '🔧',
    regrettedBaseline: 5,
    askDealValue: false,
    thirdScenario: 'process-improvement',
  },
  finance: {
    name: 'Finance',
    icon: '📊',
    regrettedBaseline: 4,
    askDealValue: false,
    thirdScenario: 'better-hire',
  },
  hr_people: {
    name: 'HR / People',
    icon: '🧑‍💼',
    regrettedBaseline: 5,
    askDealValue: false,
    thirdScenario: 'better-hire',
  },
  other: {
    name: 'Other / Cross-functional',
    icon: '🏢',
    regrettedBaseline: 5,
    askDealValue: false,
    thirdScenario: 'better-hire',
  },
};

/**
 * Salary ranges by level (for quick-pick buttons).
 */
export const SALARY_RANGES = {
  entry:    { label: '$40K - $60K',   midpoint: 50000,  role: 'entry' },
  mid:      { label: '$60K - $90K',   midpoint: 75000,  role: 'mid' },
  senior:   { label: '$90K - $130K',  midpoint: 110000, role: 'mid' },
  manager:  { label: '$100K - $150K', midpoint: 125000, role: 'manager' },
  director: { label: '$150K - $220K', midpoint: 185000, role: 'manager' },
  executive:{ label: '$200K+',        midpoint: 275000, role: 'executive' },
};

/**
 * Conservative leadership-impact assumptions (used for SECONDARY breakdown only,
 * never for the headline number). Numbers are intentionally on the low end.
 */
export const LEADERSHIP_IMPACT = {
  // Probability/share of one direct report who would have left being retained
  // because of better leadership (Gallup: people leave managers, not companies).
  // We frame this as "save 1 person from leaving" — a binary, defensible event.
  retentionLift: 0.20,        // 20% reduction in turnover (conservative end)
  // Capacity reclaimed for the leader through fewer reactive issues / better delegation.
  capacityHoursPerWeek: 2,    // 2 hrs/week — deliberately small, easy to defend
  // Productivity ripple on the team (NOT used in headline; only in optional breakdown)
  teamProductivityLift: 0.08, // 8% team productivity gain (conservative end of Gallup)
  // Working weeks per year for capacity calculations
  workingWeeksPerYear: 50,
  // Standard work hours per year
  workHoursPerYear: 2080,
};

/**
 * Pick the role bucket that best matches a salary. Falls back to "mid".
 */
function inferRoleFromSalary(salary) {
  if (salary >= 200000) return 'executive';
  if (salary >= 100000) return 'manager';
  if (salary >= 60000)  return 'mid';
  return 'entry';
}

/**
 * Cost of replacing ONE person at a given salary + role.
 */
function replacementCost(salary, role) {
  const bucket = ROLE_REPLACEMENT_COST[role] || ROLE_REPLACEMENT_COST.mid;
  return salary * bucket.pct;
}

/**
 * Build the department-specific "third scenario" — the upside lever beyond
 * "save one person" and "reclaim leader capacity."
 */
function buildThirdScenario({ department, leaderSalary, reportSalary, reportRole, dealValue, trainingInvestment }) {
  const dept = DEPARTMENTS[department] || DEPARTMENTS.other;
  const replCost = replacementCost(reportSalary, reportRole);

  switch (dept.thirdScenario) {
    case 'one-more-deal': {
      const value = dealValue || Math.max(trainingInvestment * 5, 25000);
      return {
        id: 'one-more-deal',
        title: 'Land one additional deal per year',
        premise: `Stronger leadership ripples into pipeline coaching and customer outcomes.`,
        value: Math.round(value),
        math: dealValue
          ? `Customer-supplied deal value: ${formatCurrency(dealValue)}`
          : `Illustrative — ${formatCurrency(value)}. Replace with your typical deal size.`,
        icon: 'target',
        illustrative: !dealValue,
      };
    }
    case 'ship-initiative': {
      // One extra meaningful initiative shipped per year ≈ ~6 weeks of leader-loaded cost.
      const value = Math.round((leaderSalary / LEADERSHIP_IMPACT.workHoursPerYear) * 40 * 6);
      return {
        id: 'ship-initiative',
        title: 'Ship one extra meaningful initiative',
        premise: `Cleaner priorities and faster decisions free the team to ship one more thing that mattered this year.`,
        value,
        math: `~6 weeks × 40 hrs × ${formatCurrency(Math.round(leaderSalary / LEADERSHIP_IMPACT.workHoursPerYear))}/hr leader-loaded cost`,
        icon: 'target',
        illustrative: true,
      };
    }
    case 'retain-account': {
      // Retain one mid-size account: rough proxy = 2× a direct-report salary in ARR.
      const value = Math.round(reportSalary * 2);
      return {
        id: 'retain-account',
        title: 'Retain one at-risk key account',
        premise: `Better-led CSMs catch churn signals earlier and save the relationship.`,
        value,
        math: `Illustrative ARR proxy: 2 × ${formatCurrency(reportSalary)} (rough mid-account size)`,
        icon: 'target',
        illustrative: true,
      };
    }
    case 'process-improvement': {
      // One process improvement saving ~1 month of a direct report's loaded cost per year.
      const value = Math.round(reportSalary / 12);
      return {
        id: 'process-improvement',
        title: 'Capture one process improvement',
        premise: `A leader who coaches well surfaces — and acts on — the one fix the team has been asking for.`,
        value,
        math: `~1 month of recovered output: ${formatCurrency(reportSalary)} / 12`,
        icon: 'target',
        illustrative: true,
      };
    }
    case 'better-hire':
    default: {
      // Avoid one bad hire that exits inside year one ≈ half a full replacement cycle.
      const value = Math.round(replCost * 0.5);
      return {
        id: 'better-hire',
        title: 'Avoid one bad hire',
        premise: `Better-developed leaders interview more rigorously and onboard more deliberately — saving one mis-hire from a year-one exit.`,
        value,
        math: `${formatCurrency(reportSalary)} × ${(ROLE_REPLACEMENT_COST[reportRole]?.pct * 100).toFixed(0)}% × 50% partial cycle`,
        icon: 'target',
        illustrative: true,
      };
    }
  }
}

/**
 * Calculate the three "verbal ROI" scenarios — the conservative, defensible
 * stories a leader can take to a CFO. These are the headline of the report.
 *
 * Inputs:
 *   leaderSalary   — fully-loaded annual salary of the leader being developed
 *   reportSalary   — average annual salary of the leader's direct reports
 *   reportRole     — 'entry' | 'mid' | 'manager' | 'executive'
 *   trainingInvestment — annual investment to develop the leader
 *   dealValue      — typical revenue of one additional deal/year (sales only)
 *   department     — which department the leader sits in
 */
function buildScenarios({ leaderSalary, reportSalary, reportRole, trainingInvestment, dealValue, department }) {
  const leaderHourly = leaderSalary / LEADERSHIP_IMPACT.workHoursPerYear;
  const capacityHours = LEADERSHIP_IMPACT.capacityHoursPerWeek * LEADERSHIP_IMPACT.workingWeeksPerYear;

  return [
    {
      id: 'retain-one',
      title: 'Save one regretted departure',
      premise: `One person you would have hated to lose, stays — because their manager got better.`,
      value: Math.round(replacementCost(reportSalary, reportRole)),
      math: `${formatCurrency(reportSalary)} × ${(ROLE_REPLACEMENT_COST[reportRole]?.pct * 100).toFixed(0)}% replacement cost`,
      icon: 'users',
    },
    {
      id: 'reclaim-capacity',
      title: `Reclaim ${LEADERSHIP_IMPACT.capacityHoursPerWeek} hours / week of leader capacity`,
      premise: `Fewer fires to fight, better delegation, cleaner decisions.`,
      value: Math.round(leaderHourly * capacityHours),
      math: `${capacityHours} hrs × ${formatCurrency(Math.round(leaderHourly))}/hr leader cost`,
      icon: 'clock',
    },
    buildThirdScenario({ department, leaderSalary, reportSalary, reportRole, dealValue, trainingInvestment }),
  ];
}

/**
 * Calculate comprehensive ROI based on inputs.
 *
 * Backwards compatibility: returns all of the legacy field names that
 * Results.jsx, EmailCapture.jsx, and the admin ROICalculatorLeadsManager
 * currently read (totalAnnualSavings, roiPercentage, paybackMonths,
 * turnoverSavings, productivityGains, etc.) so existing UI + lead pipelines
 * continue to work without migration.
 */
export function calculateROI(inputs) {
  const {
    numLeaders = 1,
    avgTeamSize = 1,
    industry = 'other',
    department = 'other',      // NEW: department of the leader being developed
    avgSalary = 75000,         // direct-report salary
    leaderSalary = 110000,     // leader/manager salary
    currentTurnover = null,    // total turnover override
    regrettedAttrition = null, // NEW: % of departures the org didn't want to lose
    trainingInvestment = 5000, // per leader
    dealValue = null,          // optional, sales-only "land one more deal" scenario
    reportRole = null,         // optional override; otherwise inferred from salary
  } = inputs;

  const industryData = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.other;
  const departmentData = DEPARTMENTS[department] || DEPARTMENTS.other;
  const totalEmployeesManaged = numLeaders * avgTeamSize;
  const effectiveTurnover = currentTurnover ?? industryData.avgTurnover;
  // Default regretted attrition: a healthy benchmark for the department, capped at total turnover.
  const effectiveRegretted = regrettedAttrition != null
    ? Math.min(regrettedAttrition, effectiveTurnover)
    : Math.min(departmentData.regrettedBaseline, effectiveTurnover);
  const role = reportRole || inferRoleFromSalary(avgSalary);

  // --- Headline scenarios (the verbal ROI) ----------------------------------
  const scenarios = buildScenarios({
    leaderSalary,
    reportSalary: avgSalary,
    reportRole: role,
    trainingInvestment,
    dealValue,
    department,
  });

  const retainOne   = scenarios.find(s => s.id === 'retain-one').value;
  const capacityOne = scenarios.find(s => s.id === 'reclaim-capacity').value;
  const thirdScenario = scenarios[2];
  const dealOne     = thirdScenario?.value || 0;
  const dealIsHard  = !!dealValue && thirdScenario?.id === 'one-more-deal';

  // Conservative annual value = sum of the two non-illustrative scenarios.
  // The third scenario is treated as upside, not baseline, when illustrative.
  const conservativeValue = retainOne + capacityOne;
  const moderateValue     = retainOne + capacityOne + (dealIsHard ? dealOne : Math.round(dealOne * 0.5));
  const optimisticValue   = retainOne + capacityOne + dealOne;

  // --- Optional aggregated breakdown (kept for backwards-compat) ------------
  // These are SECONDARY context only — not the headline.
  const expectedDepartures = totalEmployeesManaged * (effectiveTurnover / 100);
  const turnoverSavings = Math.round(
    expectedDepartures * replacementCost(avgSalary, role) * LEADERSHIP_IMPACT.retentionLift
  );
  const productivityGains = Math.round(
    totalEmployeesManaged * avgSalary * LEADERSHIP_IMPACT.teamProductivityLift
  );
  const capacityValue = Math.round(
    numLeaders * (leaderSalary / LEADERSHIP_IMPACT.workHoursPerYear) *
    LEADERSHIP_IMPACT.capacityHoursPerWeek * LEADERSHIP_IMPACT.workingWeeksPerYear
  );

  // Indirect cost transparency — what makes up replacement cost
  const indirectBreakdown = {
    recruitingFees: Math.round(avgSalary * 0.15),       // ~15% headhunter / sourcing
    vacancyProductivity: Math.round(avgSalary * 0.10),  // ~6 weeks vacancy gap
    rampUpTime: Math.round(avgSalary * 0.15),           // 3-6 months to full productivity
    topPerformerTraining: Math.round(avgSalary * 0.05), // peers absorb training load
  };

  // --- Investment & ROI -----------------------------------------------------
  const totalInvestment = numLeaders * trainingInvestment;
  // Headline ROI is computed off the CONSERVATIVE value, not the optimistic one.
  const totalAnnualSavings = conservativeValue * numLeaders;
  const netGain = totalAnnualSavings - totalInvestment;
  const roiPercentage = totalInvestment > 0
    ? Math.round(((totalAnnualSavings - totalInvestment) / totalInvestment) * 100)
    : 0;
  const paybackMonths = totalAnnualSavings > 0
    ? Math.round((totalInvestment / (totalAnnualSavings / 12)) * 10) / 10
    : null;

  return {
    // ---- New, headline output (per the May 2026 design call) ----
    scenarios,
    perLeader: {
      conservativeValue,
      moderateValue,
      optimisticValue,
      retainOne,
      capacityOne,
      dealOne,
    },
    indirectBreakdown,
    role,
    roleLabel: ROLE_REPLACEMENT_COST[role]?.label || 'Mid-level',
    replacementPct: ROLE_REPLACEMENT_COST[role]?.pct || 0.5,

    // ---- Department + attrition framing ----
    department,
    departmentName: departmentData.name,
    regrettedAttrition: effectiveRegretted,
    regrettedAttritionProvided: regrettedAttrition != null,
    totalTurnover: effectiveTurnover,

    // ---- Legacy fields (kept for back-compat) ----
    totalAnnualSavings: Math.round(totalAnnualSavings),
    totalInvestment: Math.round(totalInvestment),
    netGain: Math.round(netGain),
    roiPercentage,
    paybackMonths,

    turnoverSavings,
    productivityGains,
    absenteeismSavings: 0,         // intentionally retired — not a defensible verbal-ROI line
    engagementValue: capacityValue, // re-purposed: "leader capacity reclaimed"

    currentTurnoverCost: Math.round(expectedDepartures * replacementCost(avgSalary, role)),
    currentProductivityLoss: 0,
    currentAbsenteeismCost: 0,
    totalCurrentCost: Math.round(expectedDepartures * replacementCost(avgSalary, role)),

    savingsRange: {
      conservative: Math.round(conservativeValue * numLeaders),
      moderate:     Math.round(moderateValue * numLeaders),
      optimistic:   Math.round(optimisticValue * numLeaders),
    },
    roiRange: {
      conservative: totalInvestment > 0
        ? Math.round(((conservativeValue * numLeaders - totalInvestment) / totalInvestment) * 100)
        : 0,
      moderate: roiPercentage,
      optimistic: totalInvestment > 0
        ? Math.round(((optimisticValue * numLeaders - totalInvestment) / totalInvestment) * 100)
        : 0,
    },

    savingsPerLeader: Math.round(totalAnnualSavings / Math.max(numLeaders, 1)),
    savingsPerEmployee: totalEmployeesManaged > 0
      ? Math.round(totalAnnualSavings / totalEmployeesManaged)
      : 0,
    costPerLeader: trainingInvestment,

    industry: industryData.name,
    industryTurnover: industryData.avgTurnover,
    totalEmployeesImpacted: totalEmployeesManaged,
    numLeaders,

    // Multi-year — keep but mark moderate not optimistic
    threeYearSavings: Math.round(totalAnnualSavings * 2.8),
    threeYearROI: totalInvestment > 0
      ? Math.round((((totalAnnualSavings * 2.8) - totalInvestment) / totalInvestment) * 100)
      : 0,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, compact = false) {
  if (compact) {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000)    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercent(value) {
  return `${Math.round(value)}%`;
}
