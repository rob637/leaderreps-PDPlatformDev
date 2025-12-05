// src/components/screens/MembershipUpgrade.jsx
// Simplified - All users have full access (no tier distinction)

import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowLeft, Check, Crown, Zap, Target, Users, Calendar, BookOpen, MessageSquare, Bot, CheckCircle } from 'lucide-react';
import { Button, Card } from '../ui';

const FeatureItem = ({ children }) => (
  <li className="flex items-start gap-3">
    <div className="mt-0.5 bg-green-100 rounded-full p-0.5">
      <Check className="w-3 h-3 text-green-600" />
    </div>
    <span className="text-sm text-slate-700">{children}</span>
  </li>
);

const MembershipUpgrade = ({ setCurrentScreen }) => {
  const { navigate } = useAppServices();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = () => {
    if (navigate) {
      navigate('dashboard');
    } else if (setCurrentScreen) {
      setCurrentScreen('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 mb-8 text-slate-500 hover:text-corporate-navy transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-corporate-orange" />
            <h1 className="text-4xl font-bold text-corporate-navy">
              Full Access
            </h1>
            <Crown className="w-8 h-8 text-corporate-orange" />
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            You have complete access to all LeaderReps features.
          </p>
        </div>

        {/* Current Plan Card */}
        <Card accentColor="bg-corporate-teal" className="mb-8">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-corporate-navy mb-2">Standard Membership</h2>
            <p className="text-slate-600 mb-4">All features included at no cost</p>
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-sm">
              ✓ Active
            </div>
          </div>
        </Card>

        {/* Features List */}
        <Card accentColor="bg-corporate-navy" className="mb-8">
          <h3 className="text-lg font-bold text-corporate-navy mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-corporate-orange" />
            Everything You Get
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <ul className="space-y-3">
              <FeatureItem>Full Development Plan & Assessment</FeatureItem>
              <FeatureItem>Complete Business Readings Library</FeatureItem>
              <FeatureItem>Complete Video & Course Library</FeatureItem>
              <FeatureItem>Unlimited AI Coaching Support</FeatureItem>
              <FeatureItem>Daily Win Tracking & Reps</FeatureItem>
            </ul>
            <ul className="space-y-3">
              <FeatureItem>Accountability Pods</FeatureItem>
              <FeatureItem>Community Posting & Discussions</FeatureItem>
              <FeatureItem>Document Downloads</FeatureItem>
              <FeatureItem>PM/AM Bookend Reflections</FeatureItem>
              <FeatureItem>Progress Tracking & History</FeatureItem>
            </ul>
          </div>
        </Card>

        {/* Support Section */}
        <Card accentColor="bg-slate-400">
          <h3 className="font-bold text-corporate-navy mb-4">Need Help?</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            If you have any questions about your membership or need assistance with any features, 
            our support team is here to help.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('mailto:support@leaderreps.com', '_blank')}
          >
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default MembershipUpgrade;
