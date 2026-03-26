// Industry benchmarks and ROI calculation logic
// Sources: Gallup, SHRM, Brandon Hall Group, McKinsey, Harvard Business Review

/**
 * Industry benchmarks for turnover rates and costs
 * Based on Bureau of Labor Statistics and SHRM data
 */
export const INDUSTRY_BENCHMARKS = {
  technology: {
    name: 'Technology & Software',
    avgTurnover: 13.2,
    replacementCostMultiplier: 1.5, // 150% of salary
    engagementImpact: 0.24, // 24% productivity boost from engagement
    icon: '💻',
  },
  healthcare: {
    name: 'Healthcare',
    avgTurnover: 19.5,
    replacementCostMultiplier: 1.3,
    engagementImpact: 0.21,
    icon: '🏥',
  },
  finance: {
    name: 'Financial Services',
    avgTurnover: 12.8,
    replacementCostMultiplier: 2.0, // Higher for specialized roles
    engagementImpact: 0.22,
    icon: '💰',
  },
  manufacturing: {
    name: 'Manufacturing',
    avgTurnover: 28.6,
    replacementCostMultiplier: 0.75,
    engagementImpact: 0.20,
    icon: '🏭',
  },
  retail: {
    name: 'Retail & Consumer',
    avgTurnover: 60.5,
    replacementCostMultiplier: 0.5,
    engagementImpact: 0.18,
    icon: '🛒',
  },
  professional_services: {
    name: 'Professional Services',
    avgTurnover: 14.2,
    replacementCostMultiplier: 1.75,
    engagementImpact: 0.23,
    icon: '📊',
  },
  education: {
    name: 'Education',
    avgTurnover: 16.1,
    replacementCostMultiplier: 0.9,
    engagementImpact: 0.19,
    icon: '🎓',
  },
  government: {
    name: 'Government & Public Sector',
    avgTurnover: 8.4,
    replacementCostMultiplier: 0.8,
    engagementImpact: 0.17,
    icon: '🏛️',
  },
  hospitality: {
    name: 'Hospitality & Food Service',
    avgTurnover: 73.8,
    replacementCostMultiplier: 0.4,
    engagementImpact: 0.16,
    icon: '🏨',
  },
  other: {
    name: 'Other',
    avgTurnover: 15.0,
    replacementCostMultiplier: 1.0,
    engagementImpact: 0.21,
    icon: '🏢',
  },
};

/**
 * Leadership development impact benchmarks
 * Based on meta-analysis of leadership training effectiveness studies
 */
export const LEADERSHIP_IMPACT = {
  // Turnover reduction from improved leadership
  // Research shows employees with effective managers are 3x more likely to stay
  turnoverReduction: {
    conservative: 0.20, // 20% reduction
    moderate: 0.35,     // 35% reduction
    optimistic: 0.50,   // 50% reduction
  },
  
  // Productivity improvement from better leadership
  // Gallup: Engaged employees are 21-25% more productive
  productivityGain: {
    conservative: 0.08, // 8% gain
    moderate: 0.15,     // 15% gain
    optimistic: 0.21,   // 21% gain (Gallup benchmark)
  },
  
  // Time to competency reduction for new hires
  // Better onboarding = faster ramp-up
  onboardingTimeReduction: {
    conservative: 0.15,
    moderate: 0.25,
    optimistic: 0.35,
  },
  
  // Absenteeism reduction
  // Engaged teams have 41% less absenteeism (Gallup)
  absenteeismReduction: {
    conservative: 0.15,
    moderate: 0.25,
    optimistic: 0.41,
  },
  
  // Engagement improvement
  // Better leadership increases discretionary effort and retention intent
  engagementImprovement: {
    conservative: 0.10, // 10% workforce becomes more engaged
    moderate: 0.18,     // 18% improvement
    optimistic: 0.25,   // 25% improvement
  },
};

/**
 * Salary ranges by level for estimation
 */
export const SALARY_RANGES = {
  entry: { min: 40000, max: 60000, label: '$40K - $60K', midpoint: 50000 },
  mid: { min: 60000, max: 90000, label: '$60K - $90K', midpoint: 75000 },
  senior: { min: 90000, max: 130000, label: '$90K - $130K', midpoint: 110000 },
  manager: { min: 100000, max: 150000, label: '$100K - $150K', midpoint: 125000 },
  director: { min: 150000, max: 220000, label: '$150K - $220K', midpoint: 185000 },
  executive: { min: 200000, max: 400000, label: '$200K+', midpoint: 275000 },
};

/**
 * Company size categories
 */
export const COMPANY_SIZES = {
  small: { min: 10, max: 49, label: '10-49 employees' },
  medium: { min: 50, max: 199, label: '50-199 employees' },
  large: { min: 200, max: 999, label: '200-999 employees' },
  enterprise: { min: 1000, max: null, label: '1,000+ employees' },
};

/**
 * Calculate comprehensive ROI based on inputs
 */
export function calculateROI(inputs) {
  const {
    numLeaders = 10,
    avgTeamSize = 8,
    industry = 'other',
    companySize = 'medium',
    avgSalary = 75000,
    currentTurnover = null, // null means use industry default
    trainingInvestment = 5000, // per leader
  } = inputs;

  const industryData = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.other;
  const totalEmployeesManaged = numLeaders * avgTeamSize;
  const effectiveTurnover = currentTurnover ?? industryData.avgTurnover;
  
  // 1. Calculate Current State (The Problem)
  const currentTurnoverCost = calculateTurnoverCost(
    totalEmployeesManaged,
    avgSalary,
    effectiveTurnover,
    industryData.replacementCostMultiplier
  );
  
  const currentProductivityLoss = calculateProductivityLoss(
    totalEmployeesManaged,
    avgSalary,
    1 - industryData.engagementImpact // Assuming current engagement gap
  );
  
  const currentAbsenteeismCost = calculateAbsenteeismCost(
    totalEmployeesManaged,
    avgSalary
  );
  
  const totalCurrentCost = currentTurnoverCost + currentProductivityLoss + currentAbsenteeismCost;
  
  // 2. Calculate Post-Training State (The Solution) - using moderate estimates
  const projectedTurnoverSavings = currentTurnoverCost * LEADERSHIP_IMPACT.turnoverReduction.moderate;
  const projectedProductivityGain = totalEmployeesManaged * avgSalary * LEADERSHIP_IMPACT.productivityGain.moderate;
  const projectedAbsenteeismSavings = currentAbsenteeismCost * LEADERSHIP_IMPACT.absenteeismReduction.moderate;
  
  // Engagement value: discretionary effort improvement from better leadership
  // Calculation: employees who become more engaged × value of increased effort (10% of salary)
  const projectedEngagementValue = totalEmployeesManaged * avgSalary * LEADERSHIP_IMPACT.engagementImprovement.moderate * 0.10;
  
  const totalAnnualSavings = projectedTurnoverSavings + projectedProductivityGain + projectedAbsenteeismSavings + projectedEngagementValue;
  
  // 3. Calculate Investment & ROI
  const totalInvestment = numLeaders * trainingInvestment;
  const netGain = totalAnnualSavings - totalInvestment;
  const roiPercentage = ((totalAnnualSavings - totalInvestment) / totalInvestment) * 100;
  const paybackMonths = totalInvestment / (totalAnnualSavings / 12);
  
  // 4. Calculate ranges (conservative to optimistic)
  const conservativeSavings = 
    currentTurnoverCost * LEADERSHIP_IMPACT.turnoverReduction.conservative +
    totalEmployeesManaged * avgSalary * LEADERSHIP_IMPACT.productivityGain.conservative +
    currentAbsenteeismCost * LEADERSHIP_IMPACT.absenteeismReduction.conservative +
    totalEmployeesManaged * avgSalary * LEADERSHIP_IMPACT.engagementImprovement.conservative * 0.10;
  
  const optimisticSavings = 
    currentTurnoverCost * LEADERSHIP_IMPACT.turnoverReduction.optimistic +
    totalEmployeesManaged * avgSalary * LEADERSHIP_IMPACT.productivityGain.optimistic +
    currentAbsenteeismCost * LEADERSHIP_IMPACT.absenteeismReduction.optimistic +
    totalEmployeesManaged * avgSalary * LEADERSHIP_IMPACT.engagementImprovement.optimistic * 0.10;
  
  // 5. Per-leader and per-employee metrics
  const savingsPerLeader = totalAnnualSavings / numLeaders;
  const savingsPerEmployee = totalAnnualSavings / totalEmployeesManaged;
  
  return {
    // Core metrics
    totalAnnualSavings: Math.round(totalAnnualSavings),
    totalInvestment: Math.round(totalInvestment),
    netGain: Math.round(netGain),
    roiPercentage: Math.round(roiPercentage),
    paybackMonths: Math.round(paybackMonths * 10) / 10,
    
    // Breakdown
    turnoverSavings: Math.round(projectedTurnoverSavings),
    productivityGains: Math.round(projectedProductivityGain),
    absenteeismSavings: Math.round(projectedAbsenteeismSavings),
    engagementValue: Math.round(projectedEngagementValue),
    
    // Current state
    currentTurnoverCost: Math.round(currentTurnoverCost),
    currentProductivityLoss: Math.round(currentProductivityLoss),
    currentAbsenteeismCost: Math.round(currentAbsenteeismCost),
    totalCurrentCost: Math.round(totalCurrentCost),
    
    // Ranges
    savingsRange: {
      conservative: Math.round(conservativeSavings),
      moderate: Math.round(totalAnnualSavings),
      optimistic: Math.round(optimisticSavings),
    },
    
    roiRange: {
      conservative: Math.round(((conservativeSavings - totalInvestment) / totalInvestment) * 100),
      moderate: Math.round(roiPercentage),
      optimistic: Math.round(((optimisticSavings - totalInvestment) / totalInvestment) * 100),
    },
    
    // Per-unit metrics
    savingsPerLeader: Math.round(savingsPerLeader),
    savingsPerEmployee: Math.round(savingsPerEmployee),
    costPerLeader: trainingInvestment,
    
    // Context
    industry: industryData.name,
    industryTurnover: industryData.avgTurnover,
    totalEmployeesImpacted: totalEmployeesManaged,
    numLeaders,
    
    // 3-year projection
    threeYearSavings: Math.round(totalAnnualSavings * 2.8), // Some compounding effect
    threeYearROI: Math.round((((totalAnnualSavings * 2.8) - totalInvestment) / totalInvestment) * 100),
  };
}

/**
 * Calculate annual turnover cost
 */
function calculateTurnoverCost(employees, avgSalary, turnoverRate, replacementMultiplier) {
  const annualTurnover = employees * (turnoverRate / 100);
  const costPerReplacement = avgSalary * replacementMultiplier;
  return annualTurnover * costPerReplacement;
}

/**
 * Calculate productivity loss from disengagement
 * Assumes 15% of workforce is actively disengaged (Gallup average)
 */
function calculateProductivityLoss(employees, avgSalary, engagementGap) {
  const disengagedPercent = 0.15;
  const productivityLossPercent = 0.34; // 34% of salary lost from disengagement
  return employees * avgSalary * disengagedPercent * productivityLossPercent;
}

/**
 * Calculate absenteeism cost
 * Average: 2.8% of payroll (CDC estimate)
 */
function calculateAbsenteeismCost(employees, avgSalary) {
  const absenteeismRate = 0.028;
  return employees * avgSalary * absenteeismRate;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, compact = false) {
  if (compact) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
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
