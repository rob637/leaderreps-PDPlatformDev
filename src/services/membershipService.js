// src/services/membershipService.js
// SIMPLIFIED: All users get full access - no tier restrictions

export const MEMBERSHIP_TIERS = {
  free: {
    id: 'free',
    name: 'Standard',
    level: 100,
    color: '#47A88D' // CORPORATE TEAL
  }
};

// All access checks return true - no restrictions
export const hasAccess = () => true;
export const checkAccess = () => true;
export const canAccessFeature = () => true;
export const getFeatureLimit = () => 'unlimited';

export const getTier = () => MEMBERSHIP_TIERS.free;

// Main membershipService object export
export const membershipService = {
  MEMBERSHIP_TIERS,
  checkAccess,
  canAccessFeature,
  getFeatureLimit,
  hasAccess,
  getTier
};