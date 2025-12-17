import React from 'react';
import { 
  Compass, CheckCircle, Calendar, User, Users, Rocket, 
  Clock, ChevronRight, Shield
} from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan, PHASES } from '../../hooks/useDailyPlan';

/**
 * MyJourneyWidget - Shows user's cohort and journey progress in Locker
 * 
 * Displays:
 * - Cohort name and start date
 * - Journey progress dots (1-5 onboarding days)
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
    daysFromStart 
  } = useDailyPlan();

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

        {/* Journey Progress (only in Prep Phase) */}
        {currentPhase?.id === 'pre-start' && journeyDay && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">Onboarding Progress</span>
              <span className="text-xs text-slate-500">
                Day {Math.min(journeyDay, 5)} of 5
              </span>
            </div>
            
            {/* Progress Dots */}
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3, 4, 5].map((day) => (
                <div key={day} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      journeyDay >= day 
                        ? 'bg-corporate-teal text-white' 
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {journeyDay >= day ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{day}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {day === 1 && 'Profile'}
                    {day === 2 && 'Bookends'}
                    {day === 3 && 'Reading'}
                    {day === 4 && 'Video'}
                    {day === 5 && 'Ready!'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facilitator Info */}
        {cohortData?.facilitator && (
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {cohortData.facilitator.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{cohortData.facilitator.name}</p>
              <p className="text-xs text-slate-500">Your Facilitator</p>
              {cohortData.facilitator.email && (
                <a 
                  href={`mailto:${cohortData.facilitator.email}`}
                  className="text-xs text-corporate-teal hover:underline"
                >
                  {cohortData.facilitator.email}
                </a>
              )}
            </div>
          </div>
        )}

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
