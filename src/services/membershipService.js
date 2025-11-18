// src/services/membershipService.js
// MEMBERSHIP SYSTEM: Free and Premium tiers

export const MEMBERSHIP_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    level: 0,
    price: 0,
    color: '#47A88D', // CORPORATE TEAL
    features: {
      // Limited Access
      dailyWeeklyContent: true,
      professionalDevPlan: false,
      fullCalendar: false,
      documentDownload: false,
      communitySubmit: false,
      aiCoaching: 'limited', // 5 per month
      
      // Content Access
      businessReadings: 'limited',
      targetReps: 'preview_only',
      coachingCalls: 'view_only',
      community: 'view_only'
    },
    limits: {
      aiInteractions: 5,
      documentAccess: 'view_only',
      planDepth: 'current_week'
    }
  },
  
  premium: {
    id: 'premium', 
    name: 'Premium',
    level: 1,
    price: 79,
    color: '#002E47', // CORPORATE NAVY
    features: {
      // Full Access
      dailyWeeklyContent: true,
      professionalDevPlan: true,
      fullCalendar: true,
      documentDownload: true,
      communitySubmit: true,
      aiCoaching: 'unlimited',
      personalizedCoaching: true,
      
      // Full Content
      businessReadings: 'full_library',
      targetReps: 'full_catalog',
      coachingCalls: 'register_attend',
      community: 'full_participation'
    },
    limits: {
      aiInteractions: 'unlimited',
      documentAccess: 'full_permissions',
      planDepth: 'full_18_months'
    }
  },
  
  dev: {
    id: 'dev',
    name: 'Developer', 
    level: 999,
    price: 0,
    color: '#E04E1B', // CORPORATE ORANGE
    features: {
      // Developer Access - See Everything
      dailyWeeklyContent: true,
      professionalDevPlan: true,
      fullCalendar: true,
      documentDownload: true,
      communitySubmit: true,
      aiCoaching: 'unlimited',
      personalizedCoaching: true,
      
      // Full Access
      businessReadings: 'full_library',
      targetReps: 'full_catalog',
      coachingCalls: 'full_access',
      community: 'full_participation'
    },
    limits: {
      aiInteractions: 'unlimited',
      documentAccess: 'full_permissions',
      planDepth: 'unlimited'
    }
  }
};

// Access Control Functions
export const checkAccess = (userMembership, featureKey) => {
  const tier = MEMBERSHIP_TIERS[userMembership?.toLowerCase()] || MEMBERSHIP_TIERS.free;
  return tier.features[featureKey] || false;
};

export const canAccessFeature = (userMembership, feature) => {
  const tier = MEMBERSHIP_TIERS[userMembership?.toLowerCase()] || MEMBERSHIP_TIERS.free;
  return tier.features[feature] === true || tier.features[feature] === 'full' || tier.features[feature] === 'unlimited';
};

export const getFeatureLimit = (userMembership, limitKey) => {
  const tier = MEMBERSHIP_TIERS[userMembership?.toLowerCase()] || MEMBERSHIP_TIERS.free;
  return tier.limits[limitKey];
};

// Check if user has access to a specific tier level
export const hasAccess = (currentTier, requiredTier) => {
  const current = MEMBERSHIP_TIERS[currentTier?.toLowerCase()] || MEMBERSHIP_TIERS.free;
  const required = MEMBERSHIP_TIERS[requiredTier?.toLowerCase()] || MEMBERSHIP_TIERS.free;
  
  const accessGranted = current.level >= required.level;
  
  console.log('🔑 [membershipService.hasAccess]:', {
    currentTier,
    requiredTier,
    currentLevel: current.level,
    requiredLevel: required.level,
    accessGranted
  });
  
  return accessGranted;
};

// Get tier information by ID
export const getTier = (tierName) => {
  return MEMBERSHIP_TIERS[tierName?.toLowerCase()] || MEMBERSHIP_TIERS.free;
};

// Membership Upgrade Prompts
export const getMembershipUpgradeMessage = (currentTier, blockedFeature) => {
  const current = MEMBERSHIP_TIERS[currentTier?.toLowerCase()] || MEMBERSHIP_TIERS.free;
  
  const messages = {
    professionalDevPlan: {
      title: "Professional Development Plan",
      message: "Unlock your personalized 18-month leadership roadmap with Arena Professional.",
      upgradeFrom: "basic"
    },
    fullCalendar: {
      title: "Full Coaching Calendar", 
      message: "Register for live coaching calls and group sessions with Arena Professional.",
      upgradeFrom: "basic"
    },
    documentDownload: {
      title: "Document Downloads",
      message: "Download and save leadership resources with Arena Professional.",
      upgradeFrom: "basic" 
    },
    communitySubmit: {
      title: "Community Participation",
      message: "Ask questions and engage with fellow leaders with Arena Professional.",
      upgradeFrom: "basic"
    }
  };
  
  return messages[blockedFeature] || {
    title: "Premium Feature",
    message: "Upgrade your membership to unlock this feature.",
    upgradeFrom: current.id
  };
};

// Main membershipService object export
export const membershipService = {
  MEMBERSHIP_TIERS,
  checkAccess,
  canAccessFeature,
  getFeatureLimit,
  hasAccess,
  getTier,
  getMembershipUpgradeMessage
};