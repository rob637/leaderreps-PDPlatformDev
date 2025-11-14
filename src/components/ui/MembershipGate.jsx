// src/components/ui/MembershipGate.jsx
import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService, MEMBERSHIP_TIERS } from '../../services/membershipService.js';
import { Crown, ArrowRight, Zap } from 'lucide-react';

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/14/25
const COLORS = {
  // === PRIMARY BRAND COLORS (from leaderreps.com) ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts  
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  
  // === SEMANTIC MAPPINGS (using ONLY corporate colors) ===
  BLUE: '#002E47',        // Map to NAVY
  GREEN: '#47A88D',       // Map to TEAL  
  AMBER: '#E04E1B',       // Map to ORANGE
  RED: '#E04E1B',         // Map to ORANGE
  PURPLE: '#47A88D',      // Map to TEAL
  
  // === TEXT & BACKGROUNDS (corporate colors only) ===
  TEXT: '#002E47',        // NAVY for all text
  MUTED: '#47A88D',       // TEAL for muted text
  BG: '#FCFCFA',          // LIGHT_GRAY for backgrounds
  OFF_WHITE: '#FCFCFA',   // Same as BG
  SUBTLE: '#47A88D'       // TEAL for subtle elements
};

/**
 * MembershipGate Component
 * 
 * Controls access to premium features based on user's membership tier.
 * Shows upgrade prompts when user doesn't have sufficient access.
 * 
 * @param {string} requiredTier - The minimum tier required ('basic', 'professional', 'elite')
 * @param {string} featureName - Display name of the feature being gated
 * @param {React.ReactNode} children - The component/content to gate
 * @param {function} navigate - Optional navigation function for upgrade flow
 */
export const MembershipGate = ({ requiredTier, featureName, children, simulatedTier }) => {
  const { membershipData, isAdmin, navigate } = useAppServices();
  
  // Admins bypass all restrictions
  if (isAdmin) {
    return children;
  }
  
  const currentTier = simulatedTier || membershipData?.currentTier || 'basic';
  const hasAccess = membershipService.hasAccess(currentTier, requiredTier);
  
  // If user has access, render the children
  if (hasAccess) {
    return children;
  }
  
  // Get tier information for upgrade prompt
  const requiredTierInfo = MEMBERSHIP_TIERS[requiredTier];
  const currentTierInfo = MEMBERSHIP_TIERS[currentTier];
  
  // Show upgrade prompt
  return (
    <div className="relative">
      {/* Blurred/disabled content */}
      <div className="opacity-30 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="bg-white rounded-lg shadow-lg border-2 p-6 max-w-md mx-4"
          style={{ 
            borderColor: requiredTierInfo.color,
            background: `linear-gradient(135deg, ${COLORS.OFF_WHITE} 0%, ${requiredTierInfo.color}10 100%)`
          }}
        >
          <div className="text-center">
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${requiredTierInfo.color}20` }}
            >
              <Crown 
                className="w-6 h-6" 
                style={{ color: requiredTierInfo.color }} 
              />
            </div>
            
            {/* Title */}
            <h3 
              className="text-lg font-bold mb-2"
              style={{ color: COLORS.TEXT }}
            >
              {requiredTierInfo.name} Feature
            </h3>
            
            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">{featureName}</span> is available with{' '}
              <span 
                className="font-bold"
                style={{ color: requiredTierInfo.color }}
              >
                {requiredTierInfo.name}
              </span>{' '}
              membership and above.
            </p>
            
            {/* Current vs Required */}
            <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <div className="text-gray-500">Current:</div>
                  <div 
                    className="font-semibold"
                    style={{ color: currentTierInfo.color }}
                  >
                    {currentTierInfo.name}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">Upgrade to:</div>
                  <div 
                    className="font-semibold"
                    style={{ color: requiredTierInfo.color }}
                  >
                    {requiredTierInfo.name}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upgrade button */}
            <button
              onClick={() => navigate && navigate('membership-module')}
              className="w-full px-4 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg"
              style={{ 
                backgroundColor: requiredTierInfo.color,
                boxShadow: `0 4px 12px ${requiredTierInfo.color}30`
              }}
            >
              <Zap className="w-4 h-4" />
              Upgrade to {requiredTierInfo.name}
            </button>
            
            {/* Pricing hint */}
            <div className="text-xs text-gray-500 mt-2">
              Starting at ${requiredTierInfo.price}/month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline upgrade prompt for smaller spaces
 */
export const MembershipPrompt = ({ requiredTier, featureName, className = "" }) => {
  const { navigate } = useAppServices();
  const requiredTierInfo = MEMBERSHIP_TIERS[requiredTier];
  
  return (
    <div 
      className={`p-4 rounded-lg border-2 border-dashed text-center ${className}`}
      style={{ 
        borderColor: `${requiredTierInfo.color}40`,
        backgroundColor: `${requiredTierInfo.color}05`
      }}
    >
      <Crown 
        className="w-8 h-8 mx-auto mb-2" 
        style={{ color: requiredTierInfo.color }} 
      />
      <h4 
        className="font-semibold mb-1"
        style={{ color: COLORS.TEXT }}
      >
        {featureName}
      </h4>
      <p className="text-sm text-gray-600 mb-3">
        Available with {requiredTierInfo.name} membership
      </p>
      <button
        onClick={() => navigate && navigate('membership-module')}
        className="px-4 py-2 rounded-lg text-white font-medium text-sm hover:shadow-lg transition-all duration-200"
        style={{ backgroundColor: requiredTierInfo.color }}
      >
        Upgrade to {requiredTierInfo.name}
      </button>
    </div>
  );
};

export default MembershipGate;