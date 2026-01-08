import React, { useState } from 'react';
import { 
  Compass, Calendar, User, Users, Rocket, 
  Clock, ChevronRight, Shield, Info
} from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan, PHASES } from '../../hooks/useDailyPlan';
import { useAppServices } from '../../services/useAppServices';
import FacilitatorProfileModal from './FacilitatorProfileModal';

/**
 * MyJourneyWidget - Shows user's cohort and journey progress in Locker
 * 
 * Displays:
 * - Cohort name and start date
 * - Prep progress (required items) - COMPLETION-BASED, not login-based
 * - Facilitator info
 * - Days until/since program start
 * - Current phase (Prep, Development Plan, Post)
 */
const MyJourneyWidget = () => {
  const { 
    cohortData, 
    currentPhase, 
    phaseDayNumber, 
    journeyDay,
    daysFromStart,
    prepRequirementsComplete
  } = useDailyPlan();
  const { updateDevelopmentPlanData } = useAppServices();

  const [showFacilitatorModal, setShowFacilitatorModal] = useState(false);

  // Calculate days until or since start
  const getDaysDisplay = () => {
    if (daysFromStart < 0) {
      const daysUntil = Math.abs(daysFromStart);
      return {
        label: 'Days Until Start',
        value: daysUntil,
        color: 'text-corporate-teal',
        bgColor: 'bg-corporate-teal/10',
        icon: Calendar
      };
    }
    if (daysFromStart === 0) {
      return {
        label: 'Day 1!',
        value: '🚀',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        icon: Rocket
      };
    }
    return {
      label: 'Days Into Program',
      value: daysFromStart,
      color: 'text-corporate-navy',
      bgColor: 'bg-corporate-navy/10',
      icon: Clock
    };
  };

  const daysDisplay = getDaysDisplay();
  const DaysIcon = daysDisplay.icon;

  // Format start date
  const formatStartDate = (timestamp) => {
    if (!timestamp) return 'Not set';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return 'Not set';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Card 
      title="My Journey" 
      icon={Compass} 
      accent="TEAL"
      className="mb-4"
    >
      <div className="space-y-4">
        {/* Cohort Info */}
        {cohortData ? (
          <div className="bg-gradient-to-br from-corporate-navy/5 to-corporate-teal/5 rounded-xl p-4 border border-corporate-teal/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Users className="w-3 h-3" />
                  <span>Your Cohort</span>
                </div>
                <h3 className="font-bold text-corporate-navy text-lg">{cohortData.name}</h3>
                {cohortData.description && (
                  <p className="text-slate-600 text-sm mt-1">{cohortData.description}</p>
                )}
              </div>
              <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl ${daysDisplay.bgColor}`}>
                <span className={`text-2xl font-bold ${daysDisplay.color}`}>{daysDisplay.value}</span>
                <span className="text-[10px] text-slate-500">{daysDisplay.label}</span>
              </div>
            </div>
            
            {/* Start Date */}
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-corporate-teal" />
              <span>Starts: <strong>{formatStartDate(cohortData.startDate)}</strong></span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No cohort assigned yet</p>
            <p className="text-slate-400 text-xs mt-1">Contact your administrator</p>
          </div>
        )}

        {/* Prep Progress (only in Prep Phase) - COMPLETION-BASED */}
        {currentPhase?.id === 'pre-start' && prepRequirementsComplete && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Prep Progress</span>
              </div>
              <span className="text-xs text-slate-500">
                {prepRequirementsComplete.completedCount} of 5 complete
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    prepRequirementsComplete.allComplete 
                      ? 'bg-emerald-500' 
                      : 'bg-corporate-teal'
                  }`}
                  style={{ width: `${prepRequirementsComplete.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">Required Items</span>
                <span className={`text-xs font-medium ${
                  prepRequirementsComplete.allComplete ? 'text-emerald-600' : 'text-corporate-teal'
                }`}>
                  {prepRequirementsComplete.progressPercent}%
                </span>
              </div>
            </div>
            
            {/* Required Items (dynamic count) */}
            <div className="space-y-2">
              {prepRequirementsComplete.items.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    item.complete 
                      ? 'bg-emerald-50 border border-emerald-100' 
                      : 'bg-slate-50 border border-slate-100'
                  }`}
                >
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.complete 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {item.complete ? '✓' : idx + 1}
                  </div>
                  <span className={`text-sm ${
                    item.complete ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Status Message */}
            {prepRequirementsComplete.allComplete ? (
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                <span className="text-emerald-700 font-medium text-sm">
                  ✨ You're ready! All pre-Session 1 resources are unlocked.
                </span>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-corporate-teal/5 rounded-lg border border-corporate-teal/20 text-center">
                <span className="text-corporate-teal font-medium text-sm">
                  Complete all items to unlock additional resources
                </span>
              </div>
            )}
          </div>
        )}

        {/* Facilitator Info */}
        {cohortData?.facilitator && (
          <button
            onClick={() => setShowFacilitatorModal(true)}
            className="w-full flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200 hover:border-corporate-teal/30 hover:bg-corporate-teal/5 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {cohortData.facilitator.photoUrl ? (
                <img 
                  src={cohortData.facilitator.photoUrl} 
                  alt={cohortData.facilitator.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                cohortData.facilitator.name?.charAt(0) || '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 group-hover:text-corporate-teal transition-colors truncate">{cohortData.facilitator.name}</p>
              <p className="text-xs text-slate-500">Your Facilitator</p>
              {cohortData.facilitator.email && (
                <p className="text-xs text-corporate-teal truncate">{cohortData.facilitator.email}</p>
              )}
            </div>
            <Info className="w-4 h-4 text-slate-300 group-hover:text-corporate-teal transition-colors flex-shrink-0" />
          </button>
        )}

        {/* Facilitator Profile Modal */}
        <FacilitatorProfileModal
          facilitator={cohortData?.facilitator}
          cohortName={cohortData?.name}
          isOpen={showFacilitatorModal}
          onClose={() => setShowFacilitatorModal(false)}
        />

        {/* Current Phase */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Current Phase</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-corporate-navy">
              {currentPhase?.displayName || 'Unknown'}
            </span>
            {phaseDayNumber && (
              <span className="text-xs text-slate-500">
                (Day {phaseDayNumber})
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MyJourneyWidget;
