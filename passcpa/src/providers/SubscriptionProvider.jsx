import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { SUBSCRIPTION_TIERS, getTierLimits, hasFeatureAccess } from '../config/subscriptions';

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to subscription changes
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'subscriptions', user.uid),
      (doc) => {
        if (doc.exists()) {
          setSubscription({ id: doc.id, ...doc.data() });
        } else {
          // Default to free tier
          setSubscription({
            tier: 'free',
            status: 'active',
            sections: [],
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Subscription listener error:', error);
        setSubscription({ tier: 'free', status: 'active', sections: [] });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Current tier info
  const currentTier = subscription?.tier || 'free';
  const tierInfo = SUBSCRIPTION_TIERS[currentTier] || SUBSCRIPTION_TIERS.free;
  const limits = getTierLimits(currentTier);

  // Check feature access
  const canAccess = (feature) => hasFeatureAccess(currentTier, feature);

  // Check if user can access a specific section
  const canAccessSection = (sectionId) => {
    if (currentTier === 'free') return false;
    if (['pro', 'ultimate'].includes(currentTier)) return true;
    // Starter tier - check if section is purchased
    return subscription?.sections?.includes(sectionId);
  };

  // Usage tracking
  const [dailyUsage, setDailyUsage] = useState({
    pennyQuestions: 0,
    questionsAnswered: 0,
  });

  // Check if user has reached daily limit
  const hasReachedLimit = (limitType) => {
    if (limits[limitType] === 'unlimited') return false;
    
    switch (limitType) {
      case 'pennyQuestionsPerDay':
        return dailyUsage.pennyQuestions >= limits.pennyQuestionsPerDay;
      default:
        return false;
    }
  };

  // Increment usage counter
  const incrementUsage = async (usageType) => {
    if (!user) return;

    setDailyUsage(prev => ({
      ...prev,
      [usageType]: (prev[usageType] || 0) + 1,
    }));

    // Persist to Firestore
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateDoc(doc(db, 'subscriptions', user.uid), {
        [`usage.${today}.${usageType}`]: (dailyUsage[usageType] || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating usage:', error);
    }
  };

  // Get upgrade prompt message
  const getUpgradePrompt = (feature) => {
    const messages = {
      unlimitedPenny: 'Upgrade to unlock unlimited AI tutor sessions',
      allSections: 'Upgrade to Pro to access all 6 exam sections',
      simulations: 'Upgrade to practice with task-based simulations',
      flashcards: 'Upgrade to unlock flashcard decks',
      simulatedExams: 'Upgrade to Pro for full-length simulated exams',
    };
    return messages[feature] || 'Upgrade to unlock this feature';
  };

  const value = {
    subscription,
    loading,
    currentTier,
    tierInfo,
    limits,
    canAccess,
    canAccessSection,
    hasReachedLimit,
    incrementUsage,
    getUpgradePrompt,
    isPremium: ['starter', 'pro', 'ultimate'].includes(currentTier),
    isTrialing: subscription?.status === 'trialing',
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
