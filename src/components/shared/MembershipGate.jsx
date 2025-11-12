// src/components/shared/MembershipGate.jsx  
// ACCESS CONTROL: Membership-based feature gating component

import React from 'react';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { checkAccess, getMembershipUpgradeMessage } from '../../services/membershipService.js';

const MembershipGate = ({ 
  children, 
  requiredFeature,
  userMembership = 'basic',
  fallbackContent = null,
  showUpgradePrompt = true 
}) => {
  const hasAccess = checkAccess(userMembership, requiredFeature);
  
  if (hasAccess) {
    return children;
  }
  
  if (fallbackContent) {
    return fallbackContent;
  }
  
  if (!showUpgradePrompt) {
    return null;
  }
  
  const upgradeInfo = getMembershipUpgradeMessage(userMembership, requiredFeature);
  
  return (
    <div className="p-6 border-2 border-dashed border-orange-300 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="flex items-center justify-center mb-4">
        <div className="p-3 bg-orange-100 rounded-full">
          <Crown className="w-6 h-6 text-orange-600" />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {upgradeInfo.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {upgradeInfo.message}
        </p>
        
        <button className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Professional
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default MembershipGate;

// Usage Examples:
// <MembershipGate requiredFeature="professionalDevPlan" userMembership={user.membership}>
//   <DevelopmentPlanComponent />  
// </MembershipGate>

// <MembershipGate requiredFeature="documentDownload" userMembership={user.membership}>
//   <DownloadButton />
// </MembershipGate>