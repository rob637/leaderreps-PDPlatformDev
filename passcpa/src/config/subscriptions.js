/**
 * PassCPA Subscription Configuration
 * 
 * Pricing Strategy:
 * - Competitive with Becker ($3,400) and Roger ($2,200)
 * - Target: Self-pay candidates who want quality at lower price
 * - Monthly option for flexibility
 * - Annual discount to encourage commitment
 */

export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Get started with limited access',
    features: [
      '50 practice questions per section',
      '5 lessons per section',
      'Basic progress tracking',
      '3 Penny AI questions per day',
    ],
    limits: {
      questionsPerSection: 50,
      lessonsPerSection: 5,
      pennyQuestionsPerDay: 3,
      simulationsPerSection: 0,
      offlineAccess: false,
      flashcards: false,
    },
    stripePriceId: null,
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    priceMonthly: 49,
    priceAnnual: 399, // ~$33/month
    savings: 189, // Annual savings
    description: 'Perfect for one section',
    perSection: true,
    features: [
      'Full access to 1 section',
      '1,200+ practice questions',
      '40+ video lessons',
      '15 task-based simulations',
      'Unlimited Penny AI tutor',
      'Performance analytics',
      'Mobile offline access',
    ],
    limits: {
      sections: 1,
      questionsPerSection: 'unlimited',
      lessonsPerSection: 'unlimited',
      pennyQuestionsPerDay: 'unlimited',
      simulationsPerSection: 'unlimited',
      offlineAccess: true,
      flashcards: true,
    },
    stripePriceIdMonthly: 'price_starter_monthly',
    stripePriceIdAnnual: 'price_starter_annual',
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: 149,
    priceMonthly: 149,
    priceAnnual: 999, // ~$83/month
    savings: 789, // Annual savings
    description: 'Full exam preparation',
    popular: true,
    features: [
      'All 6 exam sections',
      '7,700+ practice questions',
      '450+ video lessons',
      '410+ task-based simulations',
      'Unlimited Penny AI tutor',
      'Personalized study plans',
      'Performance analytics',
      'Mobile offline access',
      'Flashcard decks',
      'Simulated exams',
      'Progress reports',
    ],
    limits: {
      sections: 6,
      questionsPerSection: 'unlimited',
      lessonsPerSection: 'unlimited',
      pennyQuestionsPerDay: 'unlimited',
      simulationsPerSection: 'unlimited',
      offlineAccess: true,
      flashcards: true,
      simulatedExams: true,
    },
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdAnnual: 'price_pro_annual',
  },

  ultimate: {
    id: 'ultimate',
    name: 'Ultimate',
    price: 249,
    priceMonthly: 249,
    priceAnnual: 1499, // ~$125/month
    savings: 1489, // Annual savings
    description: 'Maximum support & guarantee',
    features: [
      'Everything in Pro, plus:',
      '1-on-1 study coaching sessions',
      'Custom study plan creation',
      'Priority Penny AI responses',
      'Extended access (24 months)',
      'Pass guarantee*',
      'Early access to new features',
      'Direct support line',
    ],
    limits: {
      sections: 6,
      questionsPerSection: 'unlimited',
      lessonsPerSection: 'unlimited',
      pennyQuestionsPerDay: 'unlimited',
      simulationsPerSection: 'unlimited',
      offlineAccess: true,
      flashcards: true,
      simulatedExams: true,
      coachingSessions: 4,
      accessMonths: 24,
      prioritySupport: true,
    },
    stripePriceIdMonthly: 'price_ultimate_monthly',
    stripePriceIdAnnual: 'price_ultimate_annual',
  },
};

// Promotional pricing
export const PROMOTIONS = {
  launch: {
    id: 'launch',
    name: 'Launch Special',
    code: 'LAUNCH50',
    discountPercent: 50,
    validUntil: '2026-03-31',
    description: 'Get 50% off your first 3 months!',
    appliesTo: ['starter', 'pro', 'ultimate'],
    maxUses: 1000,
  },
  student: {
    id: 'student',
    name: 'Student Discount',
    code: 'STUDENT20',
    discountPercent: 20,
    description: '20% off for current students',
    appliesTo: ['starter', 'pro'],
    requiresVerification: true,
  },
  referral: {
    id: 'referral',
    name: 'Referral Bonus',
    discountPercent: 15,
    description: 'Give 15%, Get 15%',
    referrerReward: 'month_free',
  },
};

// Feature gates for checking access
export const FEATURE_GATES = {
  // Content access
  fullQuestionBank: ['starter', 'pro', 'ultimate'],
  allLessons: ['starter', 'pro', 'ultimate'],
  simulations: ['starter', 'pro', 'ultimate'],
  allSections: ['pro', 'ultimate'],
  
  // AI features
  unlimitedPenny: ['starter', 'pro', 'ultimate'],
  priorityPenny: ['ultimate'],
  
  // Study tools
  flashcards: ['starter', 'pro', 'ultimate'],
  simulatedExams: ['pro', 'ultimate'],
  customStudyPlan: ['pro', 'ultimate'],
  offlineAccess: ['starter', 'pro', 'ultimate'],
  
  // Support
  coaching: ['ultimate'],
  prioritySupport: ['ultimate'],
};

// Check if user has access to a feature
export const hasFeatureAccess = (userTier, feature) => {
  const allowedTiers = FEATURE_GATES[feature];
  if (!allowedTiers) return true; // Feature not gated
  return allowedTiers.includes(userTier);
};

// Get tier limits
export const getTierLimits = (tierId) => {
  const tier = SUBSCRIPTION_TIERS[tierId];
  return tier?.limits || SUBSCRIPTION_TIERS.free.limits;
};

// Calculate price with discount
export const calculatePrice = (tierId, billingCycle, promoCode) => {
  const tier = SUBSCRIPTION_TIERS[tierId];
  if (!tier) return 0;
  
  let price = billingCycle === 'annual' ? tier.priceAnnual : tier.priceMonthly;
  
  if (promoCode) {
    const promo = Object.values(PROMOTIONS).find(p => p.code === promoCode);
    if (promo && promo.appliesTo.includes(tierId)) {
      price = price * (1 - promo.discountPercent / 100);
    }
  }
  
  return Math.round(price * 100) / 100;
};
