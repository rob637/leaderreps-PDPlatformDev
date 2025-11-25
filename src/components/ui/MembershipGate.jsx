// src/components/ui/MembershipGate.jsx
import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService, MEMBERSHIP_TIERS } from '../../services/membershipService.js';
import { Crown, ArrowRight, Zap } from 'lucide-react';

/**
 * MembershipGate Component
 * 
 * Controls access to premium features based on user's membership tier.
 * Shows upgrade prompts when user doesn't have sufficient access.
 * 
 * @param {string} requiredTier - The minimum tier required ('free', 'premium')
 * @param {string} featureName - Display name of the feature being gated
 * @param {React.ReactNode} children - The component/content to gate
 * @param {function} navigate - Optional navigation function for upgrade flow
 */
export const MembershipGate = ({ requiredTier, featureName, children, simulatedTier }) => {
  const { membershipData, isAdmin, navigate } = useAppServices();
  
  // Determine current tier - use simulatedTier if provided (from tier toggle), otherwise use actual membership
  const currentTier = simulatedTier || membershipData?.currentTier || 'free';
  const hasAccess = membershipService.hasAccess(currentTier, requiredTier);
  
  console.log(`🚪 [MembershipGate] Checking access for ${featureName}:`, {
    featureName,
    currentTier,
    requiredTier,
    simulatedTier,
    membershipDataTier: membershipData?.currentTier,
    hasAccess,
    isAdmin
  });
  
  // If user has access, render the children
  if (hasAccess) {
    console.log(`✅ [MembershipGate] Access granted for ${featureName}`);
    return children;
  }
  
  console.log(`❌ [MembershipGate] Access denied for ${featureName}`);
  
  // No popup overlay - let the component handle its own upgrade messaging
  // The component will show its own upgrade link at the bottom
  return children;
};

export default MembershipGate;