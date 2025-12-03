import React from 'react';
import { Lock } from 'lucide-react';
import { useAccessControlContext } from '../../providers/AccessControlProvider';

const AccessGate = ({ type, id, children, fallback = null, showDefaultLocked = false }) => {
  const { 
    loading, 
    isContentUnlocked, 
    isCommunityUnlocked, 
    isCoachingUnlocked, 
    isRepUnlocked 
  } = useAccessControlContext();

  if (loading) {
    // While loading, we might want to show nothing or a skeleton.
    // For safety, we don't show the protected content.
    return null; 
  }

  let isUnlocked = false;

  switch (type) {
    case 'content':
      isUnlocked = isContentUnlocked(id);
      break;
    case 'community':
      isUnlocked = isCommunityUnlocked(id);
      break;
    case 'coaching':
      isUnlocked = isCoachingUnlocked(id);
      break;
    case 'rep':
      isUnlocked = isRepUnlocked(id);
      break;
    default:
      console.warn(`AccessGate: Unknown type '${type}'`);
      isUnlocked = false;
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showDefaultLocked) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
        <Lock className="w-8 h-8 mb-2" />
        <p className="text-sm font-bold">Content Locked</p>
        <p className="text-xs">Complete previous weeks to unlock.</p>
      </div>
    );
  }

  return null;
};

export default AccessGate;
