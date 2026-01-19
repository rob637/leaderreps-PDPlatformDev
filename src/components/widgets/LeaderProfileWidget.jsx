import React, { useState } from 'react';
import { User, CheckCircle, ChevronRight, Clock, Award, Sparkles } from 'lucide-react';
import { Card } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';

/**
 * Leader Profile Widget for Dashboard
 * Shows during Prep Phase to encourage profile completion
 */
const LeaderProfileWidget = () => {
  const { profile, loading, isComplete } = useLeaderProfile();
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <Card accent="TEAL" className="animate-pulse">
        <div className="h-24 bg-slate-100 rounded-lg" />
      </Card>
    );
  }

  // Profile is complete - show success state
  if (isComplete) {
    return (
      <>
        <Card accent="TEAL">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-corporate-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                Leader Profile Complete
              </h3>
              <p className="text-sm text-slate-500" style={{ fontFamily: 'var(--font-body)' }}>
                Welcome, {profile?.firstName}! Your personalized journey is ready.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-corporate-teal hover:text-corporate-teal/80 hover:underline transition-colors"
            >
              View or Update
            </button>
          </div>
        </Card>

        {/* Modal for editing */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl my-auto">
              <LeaderProfileFormSimple 
                onComplete={() => setShowForm(false)}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Profile incomplete - show CTA
  return (
    <>
      <Card accent="ORANGE">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-corporate-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-corporate-orange" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-corporate-navy mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                Complete Your Leader Profile
              </h3>
              
              <p className="text-sm text-slate-600 mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                Help us personalize your Foundation journey. Takes about 2 minutes.
              </p>

              {/* Benefits */}}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 text-corporate-orange" />
                  Personalized content
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                  <Award className="w-3 h-3 text-corporate-teal" />
                  Better coaching
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-corporate-navy" />
                  ~2 min
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 
                  bg-corporate-orange hover:bg-corporate-orange/90
                  text-white font-semibold rounded-lg shadow-sm hover:shadow 
                  transition-all text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Start Profile
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl my-auto">
            <LeaderProfileFormSimple 
              onComplete={() => setShowForm(false)}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LeaderProfileWidget;
