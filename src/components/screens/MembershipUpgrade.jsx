// src/components/screens/MembershipUpgrade.jsx

import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { MEMBERSHIP_TIERS } from '../../services/membershipService.js';
import { ArrowLeft, Check, Crown, Zap, Target, Users, Calendar, BookOpen, MessageSquare, Bot } from 'lucide-react';
import { Button, Card } from '../ui';

const FeatureList = ({ features, included = true }) => {
  if (!features || !Array.isArray(features) || features.length === 0) {
    return <div className="text-slate-400 text-sm italic">No features listed</div>;
  }
  
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          {included ? (
            <div className="mt-0.5 bg-green-100 rounded-full p-0.5">
                <Check className="w-3 h-3 text-green-600" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0 mt-0.5" />
          )}
          <span className={`text-sm ${included ? 'text-slate-700' : 'text-slate-400'}`}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
};

const TierCard = ({ tier, isCurrentTier = false, onUpgrade, isPopular = false }) => {
  const tierData = MEMBERSHIP_TIERS[tier];
  
  if (!tierData) return null;
  
  const getFeatures = () => {
    switch(tier) {
      case 'free':
        return [
          'Limited Leadership Content',
          'Basic Development Plan Access',
          'View Community Posts',
          'Limited AI Coaching (5/month)',
          'Sample Content Library',
          'Mobile & Desktop Access'
        ];
      case 'premium':
        return [
          'Everything in Free',
          'Full Development Plan & Assessment',
          'Accountability Pod Matching',
          'Complete Business Readings Library',
          'Complete Video & Course Library',
          'Unlimited AI Coaching Support',
          'Document Downloads & Calendar Sync',
          'Community Posting & Discussions',
          'Priority Support'
        ];
      default:
        return [];
    }
  };

  return (
    <div className={`relative h-full ${isPopular ? 'transform md:-translate-y-4' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
            <Crown className="w-3 h-3" /> Most Popular
          </div>
        </div>
      )}
      
      <Card 
        accentColor={isPopular ? 'bg-gradient-to-r from-orange-500 to-amber-500' : tier === 'free' ? 'bg-corporate-teal' : 'bg-purple-600'} 
        className={`h-full flex flex-col ${isPopular ? 'ring-2 ring-orange-200 shadow-xl' : ''}`}
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-corporate-navy mb-2">
            {tierData.name}
          </h3>
          
          <div className="mb-6 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-corporate-navy">
              ${tierData.price}
            </span>
            <span className="text-slate-500 font-medium">/month</span>
          </div>
          
          {isCurrentTier ? (
            <Button variant="ghost" disabled className="w-full bg-slate-100 text-slate-500 border border-slate-200">
              Current Plan
            </Button>
          ) : (
            <Button 
              variant={isPopular ? 'upgrade' : 'primary'} 
              onClick={() => onUpgrade(tier)}
              className="w-full"
            >
              {tier === 'free' ? 'Get Started' : `Upgrade to ${tierData.name}`}
            </Button>
          )}
        </div>
        
        <div className="border-t border-slate-100 pt-6 flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">What's Included</p>
            <FeatureList features={getFeatures()} />
        </div>
      </Card>
    </div>
  );
};

const MembershipUpgrade = ({ setCurrentScreen, simulatedTier }) => {
  const { membershipData } = useAppServices();
  const currentTier = simulatedTier || membershipData?.currentTier || 'free';
  const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpgrade = (tier) => {
    if (isDeveloperMode) {
      alert(`Upgrade to ${MEMBERSHIP_TIERS[tier].name} - Payment integration coming soon!`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Button */}
        <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex items-center gap-2 mb-8 text-slate-500 hover:text-corporate-navy transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-corporate-orange" />
            <h1 className="text-4xl font-bold text-corporate-navy">
              Membership Plans
            </h1>
            <Crown className="w-8 h-8 text-corporate-orange" />
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the perfect plan to accelerate your leadership development.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto items-start">
          <TierCard 
            tier="free" 
            isCurrentTier={currentTier === 'free'}
            onUpgrade={handleUpgrade}
          />
          <TierCard 
            tier="premium" 
            isCurrentTier={currentTier === 'premium'}
            onUpgrade={handleUpgrade}
            isPopular={true}
          />
        </div>

        {/* Feature Comparison */}
        <Card className="mb-12" accentColor="bg-corporate-navy">
          <h2 className="text-2xl font-bold mb-8 text-center text-corporate-navy">
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Features</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Free</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-corporate-orange uppercase tracking-wider">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                    { name: 'Development Plan Access', free: 'Limited', premium: 'Full Access' },
                    { name: 'AI Coaching Sessions', free: '5/month', premium: 'Unlimited' },
                    { name: 'Accountability Pods', free: 'View Only', premium: true },
                    { name: 'Content Library', free: 'Limited', premium: 'Full Access' },
                    { name: 'Development Plan', free: 'Limited', premium: 'Full + Assessment' },
                ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-700">{row.name}</td>
                        <td className="text-center py-4 px-6 text-slate-500">{row.free}</td>
                        <td className="text-center py-4 px-6 font-semibold text-corporate-navy">
                            {row.premium === true ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.premium}
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ Section */}
        <Card accentColor="bg-slate-400">
          <h2 className="text-2xl font-bold mb-8 text-corporate-navy">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-corporate-navy mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Yes, you can change your membership tier at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-corporate-navy mb-2">What's included in the AI Coaching?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Our AI coaching provides personalized leadership development insights, scenario practice, and guidance tailored to your specific challenges and goals.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-corporate-navy mb-2">How do Accountability Pods work?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Pods are small groups (4-8 members) of leaders who support each other's growth through regular check-ins, shared goals, and peer accountability.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MembershipUpgrade;
