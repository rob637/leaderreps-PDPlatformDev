import React, { useState } from 'react';
import { 
  Compass, Calendar, User, Users, Rocket, 
  Clock, ChevronRight, Shield, Info, Zap
} from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan, PHASES } from '../../hooks/useDailyPlan';
import { timeService } from '../../services/timeService';
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
 * 
 * @param {boolean} showPrepProgress - Whether to show prep progress section (default true)
 */
const MyJourneyWidget = ({ showPrepProgress = true }) => {
  const { 
    cohortData, 
    currentPhase, 
    phaseDayNumber, 
    // journeyDay - available if needed
    daysFromStart,
    prepRequirementsComplete
  } = useDailyPlan();
  // useAppServices - available if needed

  const [showFacilitatorModal, setShowFacilitatorModal] = useState(false);
  
  // Secret time traveler state
  const [secretClicks, setSecretClicks] = useState(0);
  const [showTimeTraveler, setShowTimeTraveler] = useState(false);
  const [timeTravelPassword, setTimeTravelPassword] = useState('');
  const [timeTravelDays, setTimeTravelDays] = useState(0);
  const [isTimeTravelUnlocked, setIsTimeTravelUnlocked] = useState(false);

  // Handle secret click on "Your Cohort"
  const handleSecretClick = () => {
    const newCount = secretClicks + 1;
    setSecretClicks(newCount);
    if (newCount >= 5) {
      setShowTimeTraveler(true);
      setSecretClicks(0);
    }
  };

  // Handle password unlock
  const handlePasswordSubmit = () => {
    if (timeTravelPassword === '7777') {
      setIsTimeTravelUnlocked(true);
      setTimeTravelPassword('');
    } else {
      alert('Invalid password');
      setTimeTravelPassword('');
    }
  };

  // Handle time travel
  const handleTimeTravel = (days) => {
    const now = timeService.getNow();
    const target = new Date(now);
    target.setDate(target.getDate() + days);
    timeService.travelTo(target);
  };

  // Reset time travel
  const handleResetTimeTravel = () => {
    timeService.reset();
  };

  // Check if time travel is active
  const isTimeTravelActive = timeService.isActive();

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
    >
      <div className="space-y-4">
        {/* Cohort Info */}
        {cohortData ? (
          <div className="bg-gradient-to-br from-corporate-navy/5 to-corporate-teal/5 rounded-xl p-4 border border-corporate-teal/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Users className="w-3 h-3" />
                  <span 
                    onClick={handleSecretClick}
                    className="cursor-default select-none"
                    title=""
                  >
                    Your Cohort
                  </span>
                  {/* Secret time travel indicator */}
                  {isTimeTravelActive && (
                    <span className="ml-1 text-[10px] text-amber-600 bg-amber-100 px-1 rounded">⚡</span>
                  )}
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
            
            {/* Facilitator Info - inline in cohort card */}
            {cohortData?.facilitator && (
              <button
                onClick={() => setShowFacilitatorModal(true)}
                className="w-full flex items-center gap-3 mt-3 pt-3 border-t border-slate-200/60 hover:bg-corporate-teal/5 rounded-lg p-2 -mx-2 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                  {cohortData.facilitator.photoUrl ? (
                    <img 
                      src={cohortData.facilitator.photoUrl} 
                      alt={cohortData.facilitator.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    cohortData.facilitator.name?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 group-hover:text-corporate-teal transition-colors truncate text-sm">{cohortData.facilitator.name}</p>
                  <p className="text-xs text-slate-500">Your Facilitator</p>
                </div>
                <Info className="w-4 h-4 text-slate-300 group-hover:text-corporate-teal transition-colors flex-shrink-0" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No cohort assigned yet</p>
            <p className="text-slate-400 text-xs mt-1">Contact your administrator</p>
          </div>
        )}

        {/* Prep Progress (only in Prep Phase) - COMPLETION-BASED */}
        {showPrepProgress && currentPhase?.id === 'pre-start' && prepRequirementsComplete && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Prep Progress</span>
              </div>
              <span className="text-xs text-slate-500">
                {prepRequirementsComplete.completedCount} of {prepRequirementsComplete.totalCount} complete
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

        {/* Secret Time Traveler Panel */}
        {showTimeTraveler && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Time Traveler</span>
              </div>
              <button 
                onClick={() => { setShowTimeTraveler(false); setIsTimeTravelUnlocked(false); }}
                className="text-amber-600 hover:text-amber-800 text-xs"
              >
                ✕ Close
              </button>
            </div>
            
            {!isTimeTravelUnlocked ? (
              // Password entry
              <div className="space-y-2">
                <input
                  type="password"
                  value={timeTravelPassword}
                  onChange={(e) => setTimeTravelPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="Enter code..."
                  className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  autoFocus
                />
                <button
                  onClick={handlePasswordSubmit}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Unlock
                </button>
              </div>
            ) : (
              // Time travel controls
              <div className="space-y-3">
                {isTimeTravelActive && (
                  <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded text-center">
                    ⚡ Time travel active: {timeService.getNow().toLocaleString()}
                  </div>
                )}
                
                {/* Quick jump buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleTimeTravel(-7)}
                    className="py-2 px-2 bg-white hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition-colors"
                  >
                    -7d
                  </button>
                  <button
                    onClick={() => handleTimeTravel(-1)}
                    className="py-2 px-2 bg-white hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition-colors"
                  >
                    -1d
                  </button>
                  <button
                    onClick={() => handleTimeTravel(1)}
                    className="py-2 px-2 bg-white hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition-colors"
                  >
                    +1d
                  </button>
                  <button
                    onClick={() => handleTimeTravel(7)}
                    className="py-2 px-2 bg-white hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition-colors"
                  >
                    +7d
                  </button>
                </div>
                
                {/* Custom days input */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={timeTravelDays}
                    onChange={(e) => setTimeTravelDays(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    placeholder="Days (+/-)"
                  />
                  <button
                    onClick={() => handleTimeTravel(timeTravelDays)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Go
                  </button>
                </div>
                
                {/* Reset button */}
                {isTimeTravelActive && (
                  <button
                    onClick={handleResetTimeTravel}
                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Reset to Real Time
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MyJourneyWidget;
