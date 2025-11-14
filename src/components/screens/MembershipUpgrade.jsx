// src/components/screens/MembershipUpgrade.jsx
// Arena v1.0 Scope: Membership upgrade page showing tier comparison
console.log('🔥 [MembershipUpgrade] MODULE LOADING - This should appear when lazy import starts');
import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { MEMBERSHIP_TIERS } from '../../services/membershipService.js';
import { ArrowLeft, Check, Crown, Zap, Target, Users, Calendar, BookOpen, MessageSquare, Bot } from 'lucide-react';
console.log('✅ [MembershipUpgrade] ALL IMPORTS SUCCESSFUL');

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/12/25
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
  console.log('FeatureList received features:', features, 'Type:', typeof features);
  
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
      <Card className="text-center p-6">
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
      case 'basic':
        return [
          'Daily & Weekly Leadership Content',
          'Basic Development Plan Access',
          'View Community Posts',
          'Limited AI Coaching (5/month)',
          'Basic Target Reps Library',
          'Mobile & Desktop Access'
        ];
      case 'professional':
        return [
          'Everything in Arena Basic',
          'Full Development Plan & Assessment',
          'Accountability Pod Matching',
          'Complete Business Readings Library',
          'Unlimited AI Coaching Support',
          'Document Downloads & Calendar Sync',
          'Community Posting & Discussions',
          'Advanced Target Reps Catalog'
        ];
      case 'elite':
        return [
          'Everything in Arena Professional',
          'Priority AI Coaching Lab Access',
          'Advanced Analytics & Insights',
          'Leadership Coaching Call Library',
          'Executive Peer Network Access',
          'Custom Development Pathways',
          'Premium Content & Masterclasses',
          'Direct Leadership Mentor Access'
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
            {tier === 'elite' && <Crown className="w-6 h-6 text-purple-600" />}
            {tier === 'professional' && <Zap className="w-6 h-6 text-blue-600" />}
            {tier === 'basic' && <Target className="w-6 h-6 text-teal-600" />}
            <h3 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
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
              {tier === 'basic' ? 'Get Started' : `Upgrade to ${tierData.name}`}
            </Button>
          )}
        </div>
        
        <FeatureList features={getFeatures()} />
      </Card>
    </div>
  );
};

const MembershipUpgrade = ({ setCurrentScreen }) => {
  const { membershipData } = useAppServices();
  const currentTier = membershipData?.currentTier || 'basic';
  
  console.log('[MembershipUpgrade] DEBUG:', { 
    hasMembershipData: !!membershipData, 
    currentTier,
    hasSetCurrentScreen: !!setCurrentScreen,
    setCurrentScreenType: typeof setCurrentScreen
  });

  const handleUpgrade = (tier) => {
    // In a real app, this would integrate with Stripe/payment processor
    console.log(`Upgrading to ${tier}`);
    // For now, just show an alert
    alert(`Upgrade to ${MEMBERSHIP_TIERS[tier].name} - Payment integration coming soon!`);
  };

  return (
    <div className="relative space-y-6 p-4 sm:p-6" style={{ backgroundColor: COLORS.BG, color: COLORS.NAVY }}>
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
            Choose Your Leadership Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock your full potential with the right membership tier. 
            Start with the basics or accelerate your growth with advanced features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <TierCard 
            tier="basic" 
            isCurrentTier={currentTier === 'basic'}
            onUpgrade={handleUpgrade}
          />
          <TierCard 
            tier="professional" 
            isCurrentTier={currentTier === 'professional'}
            onUpgrade={handleUpgrade}
            isPopular={true}
          />
          <TierCard 
            tier="elite" 
            isCurrentTier={currentTier === 'elite'}
            onUpgrade={handleUpgrade}
          />
        </div>

        {/* Feature Comparison */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: COLORS.NAVY }}>
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Features</th>
                  <th className="text-center py-4 px-4">Arena Basic</th>
                  <th className="text-center py-4 px-4">Arena Professional</th>
                  <th className="text-center py-4 px-4">Arena Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-4 px-4 font-medium">Development Plan Access</td>
                  <td className="text-center py-4 px-4">Basic</td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">AI Coaching Sessions</td>
                  <td className="text-center py-4 px-4">5/month</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                  <td className="text-center py-4 px-4">Priority Access</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Accountability Pods</td>
                  <td className="text-center py-4 px-4">View Only</td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Business Readings Library</td>
                  <td className="text-center py-4 px-4">Daily/Weekly Only</td>
                  <td className="text-center py-4 px-4">Full Library</td>
                  <td className="text-center py-4 px-4">Full + Exclusive</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Leadership Coaching Calls</td>
                  <td className="text-center py-4 px-4">View Only</td>
                  <td className="text-center py-4 px-4">Full Access</td>
                  <td className="text-center py-4 px-4">Live Participation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ Section */}
        <Card>
          <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.NAVY }}>
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
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
  );
};

export default MembershipUpgrade;