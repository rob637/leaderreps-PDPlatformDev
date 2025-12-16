import React, { useState } from 'react';
import { User, CheckCircle, ChevronRight, Clock, Award, Sparkles } from 'lucide-react';
import { Card } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import LeaderProfileForm from '../profile/LeaderProfileForm';

/**
 * Leader Profile Widget for Dashboard
 * Shows during Prep Phase to encourage profile completion
 */
const LeaderProfileWidget = () => {
  const { profile, loading, isComplete, completionPercentage } = useLeaderProfile();
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <Card accent="GOLD" className="animate-pulse">
        <div className="h-32 bg-slate-100 rounded-lg" />
      </Card>
    );
  }

  // Profile is complete - show success state
  if (isComplete) {
    return (
      <Card accent="TEAL">
        <div className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-corporate-navy">Leader Profile Complete</h3>
            <p className="text-sm text-slate-500">
              Welcome, {profile?.firstName}! Your personalized journey is ready.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-corporate-teal hover:underline"
          >
            Edit Profile
          </button>
        </div>
      </Card>
    );
  }

  // Profile incomplete - show CTA
  return (
    <>
      <Card accent="GOLD" className="overflow-hidden">
        <div className="relative">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-corporate-gold/20 to-transparent rounded-bl-full" />
          
          <div className="p-5 relative">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-corporate-gold to-corporate-gold/80 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-corporate-navy">Complete Your Leader Profile</h3>
                  <span className="px-2 py-0.5 bg-corporate-gold/20 text-corporate-gold text-xs font-bold rounded-full">
                    Day 1 Task
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  Help us personalize your QuickStart journey. Takes about 2 minutes.
                </p>

                {/* Progress indicator */}
                {completionPercentage > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{completionPercentage}% complete</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-corporate-gold transition-all duration-500 rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Benefits */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-corporate-gold" />
                    Personalized content
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                    <Award className="w-3 h-3 text-corporate-teal" />
                    Better coaching matches
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3 text-blue-500" />
                    ~2 min
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 
                    bg-gradient-to-r from-corporate-gold to-corporate-gold/90 
                    hover:from-corporate-gold/90 hover:to-corporate-gold/80
                    text-white font-semibold rounded-xl shadow-md hover:shadow-lg 
                    transition-all transform hover:-translate-y-0.5"
                >
                  {completionPercentage > 0 ? 'Continue Profile' : 'Start Profile'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative max-h-[90vh] overflow-y-auto">
            <LeaderProfileForm 
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
