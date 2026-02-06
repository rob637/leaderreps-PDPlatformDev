import { Link } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../providers/SubscriptionProvider';
import clsx from 'clsx';

/**
 * Paywall component that gates premium content
 * 
 * Usage:
 * <Paywall feature="allSections">
 *   <PremiumContent />
 * </Paywall>
 */
const Paywall = ({ 
  feature, 
  children, 
  fallback = null,
  showTeaser = true,
  className = ''
}) => {
  const { canAccess, getUpgradePrompt, currentTier, isPremium } = useSubscription();

  // If user has access, render children
  if (canAccess(feature)) {
    return children;
  }

  // If fallback provided, use it
  if (fallback) {
    return fallback;
  }

  // Default paywall UI
  const message = getUpgradePrompt(feature);

  return (
    <div className={clsx("relative", className)}>
      {/* Teaser content (blurred) */}
      {showTeaser && children && (
        <div className="blur-sm pointer-events-none opacity-50">
          {children}
        </div>
      )}

      {/* Paywall Overlay */}
      <div className={clsx(
        "absolute inset-0 flex items-center justify-center p-4",
        showTeaser && children ? "bg-white/80 backdrop-blur-sm" : "bg-slate-50"
      )}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Premium Feature
          </h3>
          <p className="text-slate-600 mb-6">
            {message}
          </p>
          <Link 
            to="/pricing" 
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          {!isPremium && (
            <p className="text-sm text-slate-500 mt-4">
              Start with a free 7-day trial
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Simple inline paywall for small features
 */
export const InlinePaywall = ({ feature, message }) => {
  const { canAccess } = useSubscription();

  if (canAccess(feature)) return null;

  return (
    <Link 
      to="/pricing"
      className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
    >
      <Lock className="w-4 h-4" />
      {message || 'Upgrade to unlock'}
    </Link>
  );
};

/**
 * Limit reached paywall
 */
export const LimitReachedPaywall = ({ limitType }) => {
  const limitMessages = {
    pennyQuestionsPerDay: {
      title: "Daily AI Limit Reached",
      message: "You've used all your free AI tutor questions for today. Upgrade for unlimited access to Penny!",
    },
    questionsPerSection: {
      title: "Question Limit Reached",
      message: "You've practiced all the free questions in this section. Upgrade for access to 1,200+ questions!",
    },
  };

  const content = limitMessages[limitType] || {
    title: "Limit Reached",
    message: "Upgrade to continue using this feature.",
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-amber-600" />
      </div>
      <h3 className="font-semibold text-amber-900 mb-2">{content.title}</h3>
      <p className="text-amber-700 text-sm mb-4">{content.message}</p>
      <Link 
        to="/pricing" 
        className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors"
      >
        Upgrade for Unlimited
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

/**
 * Section locked paywall
 */
export const SectionLockedPaywall = ({ sectionName }) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {sectionName} Section Locked
      </h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Upgrade to Pro for access to all 6 CPA exam sections, or purchase this section individually.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link 
          to="/pricing" 
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          Upgrade to Pro
        </Link>
        <Link 
          to={`/pricing?section=${sectionName}`}
          className="inline-flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-semibold border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          Buy This Section
        </Link>
      </div>
    </div>
  );
};

export default Paywall;
