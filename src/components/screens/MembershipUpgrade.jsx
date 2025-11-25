// src/components/screens/MembershipUpgrade.jsx

import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { MEMBERSHIP_TIERS } from '../../services/membershipService.js';
import { ArrowLeft, Check, Crown, Zap, Target, Users, Calendar, BookOpen, MessageSquare, Bot } from 'lucide-react';

// --- Standardized UI Components ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#47A88D] text-white shadow-md hover:bg-[#3d917a] focus:ring-[#47A88D]/50",
    secondary: "bg-[#E04E1B] text-white shadow-md hover:bg-[#c44317] focus:ring-[#E04E1B]/50",
    outline: "bg-white text-[#47A88D] border-2 border-[#47A88D] shadow-sm hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    upgrade: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] focus:ring-orange-500/50",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-4 text-lg",
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', accentColor = 'bg-[#002E47]' }) => {
  return (
    <div className={`relative w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}>
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

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
        accentColor={isPopular ? 'bg-gradient-to-r from-orange-500 to-amber-500' : tier === 'free' ? 'bg-[#47A88D]' : 'bg-purple-600'} 
        className={`h-full flex flex-col ${isPopular ? 'ring-2 ring-orange-200 shadow-xl' : ''}`}
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-[#002E47] mb-2">
            {tierData.name}
          </h3>
          
          <div className="mb-6 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-[#002E47]">
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
            className="flex items-center gap-2 mb-8 text-slate-500 hover:text-[#002E47] transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to The Arena</span>
        </button>

        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-[#E04E1B]" />
            <h1 className="text-4xl font-bold text-[#002E47]">
              Membership Plans
            </h1>
            <Crown className="w-8 h-8 text-[#E04E1B]" />
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
        <Card className="mb-12" accentColor="bg-[#002E47]">
          <h2 className="text-2xl font-bold mb-8 text-center text-[#002E47]">
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Features</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Free</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-[#E04E1B] uppercase tracking-wider">Premium</th>
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
                        <td className="text-center py-4 px-6 font-semibold text-[#002E47]">
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
          <h2 className="text-2xl font-bold mb-8 text-[#002E47]">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-[#002E47] mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Yes, you can change your membership tier at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-[#002E47] mb-2">What's included in the AI Coaching?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Our AI coaching provides personalized leadership development insights, scenario practice, and guidance tailored to your specific challenges and goals.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-[#002E47] mb-2">How do Accountability Pods work?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Pods are small groups (4-8 members) of leaders who support each other's growth through regular check-ins, shared goals, and peer accountability.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MembershipUpgrade;


const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: `text-white hover:shadow-lg focus:ring-teal-500`,
    secondary: `text-white hover:opacity-90 focus:ring-navy-500`,
    outline: `border-2 text-teal-600 hover:text-white focus:ring-teal-500`,
    ghost: `text-gray-600 hover:bg-gray-100 focus:ring-gray-500`,
    danger: `text-white hover:opacity-90 focus:ring-red-500`,
    upgrade: `text-white hover:shadow-lg focus:ring-orange-500`
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        background: variant === 'primary' ? `linear-gradient(135deg, ${COLORS.TEAL}, ${COLORS.BLUE})` :
                   variant === 'upgrade' ? `linear-gradient(135deg, ${COLORS.ORANGE}, ${COLORS.AMBER})` :
                   variant === 'secondary' ? COLORS.NAVY :
                   variant === 'danger' ? COLORS.RED :
                   variant === 'outline' ? 'transparent' :
                   undefined,
        borderColor: variant === 'outline' ? COLORS.TEAL : undefined
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', accent }) => {
  const accentColors = {
    TEAL: COLORS.TEAL,
    NAVY: COLORS.NAVY,
    ORANGE: COLORS.ORANGE,
    BLUE: COLORS.BLUE,
    PURPLE: COLORS.PURPLE
  };
  
  const accentColor = accent ? accentColors[accent] : COLORS.TEAL;
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${className}`}
      style={{ borderLeftColor: accentColor }}
    >
      {children}
    </div>
  );
};

const FeatureList = ({ features, included = true }) => {
  // Extensive defensive checking for features array
  if (!features) {
    console.error('FeatureList: features is null or undefined');
    return <div className="text-red-500 text-sm">Error: No features provided</div>;
  }
  
  if (!Array.isArray(features)) {
    console.error('FeatureList: features is not an array:', features, 'Type:', typeof features);
    return <div className="text-red-500 text-sm">Error: Features must be an array, got: {typeof features}</div>;
  }
  
  if (features.length === 0) {
    return <div className="text-gray-500 text-sm">No features available</div>;
  }
  
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          {included ? (
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
          )}
          <span className={`text-sm ${included ? 'text-gray-700' : 'text-gray-400'}`}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
};

const TierCard = ({ tier, isCurrentTier = false, onUpgrade, isPopular = false }) => {
  const tierData = MEMBERSHIP_TIERS[tier];
  
  // Early return if tierData is undefined
  if (!tierData) {
    console.error('TierCard: tierData is undefined for tier:', tier);
    return (
      <Card className="text-center p-3 sm:p-4 lg:p-6">
        <div className="text-red-500">
          <h3 className="text-xl font-bold mb-2">Error Loading Tier</h3>
          <p>Unable to load data for tier: {tier}</p>
        </div>
      </Card>
    );
  }
  
  const getFeatures = () => {
    // Defensive check to ensure tier is defined
    if (!tier) {
      console.warn('TierCard: tier prop is undefined');
      return [];
    }
    
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
        console.warn('TierCard: Unknown tier:', tier);
        return [];
    }
  };

  return (
    <div className={`relative ${isPopular ? 'transform scale-105' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold">
            Most Popular
          </div>
        </div>
      )}
      
      <Card accent={isPopular ? 'ORANGE' : tier === 'elite' ? 'PURPLE' : 'TEAL'} className={isPopular ? 'ring-2 ring-orange-200' : ''}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {tier === 'premium' && <Crown className="w-6 h-6 text-orange-600" />}
            {tier === 'free' && <Target className="w-6 h-6 text-teal-600" />}
            <h3 className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              {tierData.name}
            </h3>
          </div>
          
          <div className="mb-4">
            <span className="text-4xl font-bold" style={{ color: COLORS.NAVY }}>
              ${tierData.price}
            </span>
            <span className="text-gray-500">/month</span>
          </div>
          
          {isCurrentTier ? (
            <Button variant="ghost" disabled className="w-full mb-6">
              Current Plan
            </Button>
          ) : (
            <Button 
              variant={isPopular ? 'upgrade' : 'primary'} 
              onClick={() => onUpgrade(tier)}
              className="w-full mb-6"
            >
              {tier === 'free' ? 'Get Started' : `Upgrade to ${tierData.name}`}
            </Button>
          )}
        </div>
        
        <FeatureList features={getFeatures()} />
      </Card>
    </div>
  );
};

const MembershipUpgrade = ({ setCurrentScreen, simulatedTier }) => {
  const { membershipData } = useAppServices();
  // Match Dashboard's exact tier logic - use simulatedTier if provided (from toggle), otherwise use actual membership tier
  const currentTier = simulatedTier || membershipData?.currentTier || 'free';
  
  // Check if developer mode is on
  const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';
  const localStorageTier = localStorage.getItem('arena-simulated-tier');
  
  // Scroll to top when component mounts to ensure users see the full page
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('🎯 [MEMBERSHIP] Tier Debug:', {
      simulatedTier,
      membershipDataTier: membershipData?.currentTier,
      computedCurrentTier: currentTier,
      isDeveloperMode,
      localStorageTier
    });
    
    // Width debugging
    setTimeout(() => {
      const container = document.querySelector('.page-corporate');
      if (container) {
        const rect = container.getBoundingClientRect();
        const computed = window.getComputedStyle(container);
        console.log('📐 [MEMBERSHIP] Width Measurements:', {
          component: 'MembershipUpgrade',
          actualWidth: `${rect.width}px`,
          maxWidth: computed.maxWidth,
          padding: computed.padding,
          margin: computed.margin,
          boxSizing: computed.boxSizing,
          classList: container.className
        });
      }
    }, 100);
  }, [simulatedTier, membershipData, currentTier, isDeveloperMode, localStorageTier]);

  const handleUpgrade = (tier) => {
    // In a real app, this would integrate with Stripe/payment processor
    // For now, just show an alert
    if (isDeveloperMode) {
      alert(`Upgrade to ${MEMBERSHIP_TIERS[tier].name} - Payment integration coming soon!`);
    }
  };

  return (
    <div className="page-corporate container-corporate animate-corporate-fade-in">
      <div className="content-full">
        {/* Debug Panel - Only show in developer mode */}
        {isDeveloperMode && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
            <div className="font-bold text-yellow-800 mb-2">🔧 Debug Info:</div>
            <div className="text-sm text-yellow-900 space-y-1">
              <div><strong>simulatedTier prop:</strong> {simulatedTier || 'undefined'}</div>
              <div><strong>membershipData tier:</strong> {membershipData?.currentTier || 'undefined'}</div>
              <div><strong>localStorage tier:</strong> {localStorageTier || 'not set'}</div>
              <div><strong>computed currentTier:</strong> {currentTier}</div>
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <div className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors" onClick={() => setCurrentScreen('dashboard')}>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to The Arena</span>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8" style={{ color: COLORS.ORANGE }} />
            <h1 className="corporate-heading-xl" style={{ color: COLORS.NAVY }}>
              Membership Plans
            </h1>
            <Crown className="w-8 h-8" style={{ color: COLORS.ORANGE }} />
          </div>
          <p className="corporate-text-body text-gray-600 mx-auto px-4">
            Choose the perfect plan to accelerate your leadership development.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
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
        <Card className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center" style={{ color: COLORS.NAVY }}>
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Features</th>
                  <th className="text-center py-4 px-4">Free</th>
                  <th className="text-center py-4 px-4">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-4 px-4 font-medium">Development Plan Access</td>
                  <td className="text-center py-4 px-4">Limited</td>
                  <td className="text-center py-4 px-4">Full Access</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">AI Coaching Sessions</td>
                  <td className="text-center py-4 px-4">5/month</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Accountability Pods</td>
                  <td className="text-center py-4 px-4">View Only</td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Content Library</td>
                  <td className="text-center py-4 px-4">Limited</td>
                  <td className="text-center py-4 px-4">Full Access</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Development Plan</td>
                  <td className="text-center py-4 px-4">Limited</td>
                  <td className="text-center py-4 px-4">Full + Assessment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ Section */}
        <Card>
          <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: COLORS.NAVY }}>
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600">Yes, you can change your membership tier at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What's included in the AI Coaching?</h3>
              <p className="text-gray-600">Our AI coaching provides personalized leadership development insights, scenario practice, and guidance tailored to your specific challenges and goals.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">How do Accountability Pods work?</h3>
              <p className="text-gray-600">Pods are small groups (4-8 members) of leaders who support each other's growth through regular check-ins, shared goals, and peer accountability.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MembershipUpgrade;