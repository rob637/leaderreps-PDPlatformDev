import React, { useState, useMemo } from 'react';
import { Compass, Calendar, Users, Shield, Info, Zap } from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useDevPlan } from '../../hooks/useDevPlan';
import { timeService } from '../../services/timeService';
import FacilitatorProfileModal from './FacilitatorProfileModal';
import FacilitatorAvatar from './FacilitatorAvatar';

// Level names matching DevelopmentJourneyWidget MILESTONE_THEMES
const LEVEL_NAMES = {
  1: 'Reinforcing',
  2: 'One-on-One (1:1)',
  3: 'Redirecting',
  4: 'Readiness',
  5: 'Foundation Complete'
};

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
  
  // Get current week/level from dev plan
  const { currentWeek } = useDevPlan();
  
  // Compute current level name to match Dev Plan journey display
  const currentLevelName = useMemo(() => {
    if (currentPhase?.id !== 'start') return null;
    const level = parseInt(currentWeek?.level || '1', 10);
    return LEVEL_NAMES[level] || LEVEL_NAMES[1];
  }, [currentPhase, currentWeek]);

  const [showFacilitatorModal, setShowFacilitatorModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  
  // Get trainers array - support both new format (facilitators array) and legacy (single facilitator)
  const trainers = useMemo(() => {
    if (cohortData?.facilitators && Array.isArray(cohortData.facilitators) && cohortData.facilitators.length > 0) {
      return cohortData.facilitators;
    }
    if (cohortData?.facilitator) {
      return [cohortData.facilitator];
    }
    return [];
  }, [cohortData]);
  
  const handleTrainerClick = (trainer) => {
    setSelectedTrainer(trainer);
    setShowFacilitatorModal(true);
  };
  
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

  // Phase pill label/colour. Foundation/Ascent get the brand teal pill; prep
  // stays neutral slate. Mirrors the dashboard header pill so the surfaces
  // tell the same story.
  const phasePill = useMemo(() => {
    const id = currentPhase?.id;
    if (id === 'start') return { label: 'Foundation', tone: 'teal' };
    if (id === 'post-start') return { label: 'Ascent', tone: 'teal' };
    if (id === 'pre-start') return { label: 'Prep', tone: 'slate' };
    return { label: currentPhase?.displayName || 'Unknown', tone: 'slate' };
  }, [currentPhase]);

  // Program day label — same math the rest of the app uses: daysFromStart is
  // 0 on the cohort start date, so display = daysFromStart + 1 once started.
  // Before start we show "Starts in N day(s)".
  const programDayText = useMemo(() => {
    if (daysFromStart === null || daysFromStart === undefined) return null;
    if (daysFromStart < 0) {
      const n = Math.abs(daysFromStart);
      return `Starts in ${n} day${n === 1 ? '' : 's'}`;
    }
    return `Day ${daysFromStart + 1} of program`;
  }, [daysFromStart]);

  return (
    <Card
      title="My Journey"
      icon={Compass}
      accent="TEAL"
    >
      <div className="space-y-2">
        {/* Cohort row — informational. Hidden click target on the icon for the
            secret time-traveler unlock (5 taps) preserves the dev-only escape
            hatch without leaking it into the UI. */}
        {cohortData ? (
          <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleSecretClick}
                aria-label="Cohort"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-corporate-teal/10 dark:bg-corporate-teal/20 cursor-default"
              >
                <Users className="w-4 h-4 text-corporate-teal-ink" />
              </button>
              <div className="text-left min-w-0">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm truncate">{cohortData.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {programDayText || 'Your cohort'}
                </p>
              </div>
            </div>
            {isTimeTravelActive && (
              <span className="text-[10px] text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded">⚡ time travel</span>
            )}
          </div>
        ) : (
          <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-corporate-navy dark:text-white text-sm">No cohort assigned</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Contact your administrator</p>
            </div>
          </div>
        )}

        {/* Program Start row */}
        {cohortData?.startDate && (
          <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-corporate-teal/10 dark:bg-corporate-teal/20">
                <Calendar className="w-4 h-4 text-corporate-teal-ink" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Program Start</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {formatStartDate(cohortData.startDate)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Phase row — pill matches dashboard header. Phase day uses
            phaseDayNumber from useDailyPlan (e.g. Foundation Day 12, Ascent
            Day 27). */}
        <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-corporate-teal/10 dark:bg-corporate-teal/20">
              <Shield className="w-4 h-4 text-corporate-teal-ink" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Current Phase</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {phaseDayNumber ? `Day ${phaseDayNumber}` : '—'}
                {currentLevelName ? ` · ${currentLevelName}` : ''}
              </p>
            </div>
          </div>
          <span
            className={
              phasePill.tone === 'teal'
                ? 'inline-flex items-center px-2.5 py-1 rounded-full bg-corporate-teal/15 text-[#1F6B59] dark:text-corporate-teal-ink text-[11px] font-semibold uppercase tracking-wider'
                : 'inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold uppercase tracking-wider'
            }
          >
            {phasePill.label}
          </span>
        </div>

        {/* Trainer row(s) — clickable, opens FacilitatorProfileModal. Same
            row chrome as the others, with the avatar replacing the icon
            disc. */}
        {trainers.map((trainer, idx) => (
          <button
            key={trainer.id || idx}
            type="button"
            onClick={() => handleTrainerClick(trainer)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-corporate-teal/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FacilitatorAvatar name={trainer.name} photoUrl={trainer.photoUrl} size="sm" />
              <div className="text-left min-w-0">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm truncate">{trainer.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {trainer.title || (trainers.length === 1 ? 'Your Trainer' : 'Your Trainer')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-corporate-teal-ink">
              <span className="text-xs font-medium">View</span>
              <Info className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}

        {/* Prep Progress (only in Prep Phase) - COMPLETION-BASED */}
        {showPrepProgress && currentPhase?.id === 'pre-start' && prepRequirementsComplete && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Prep Progress</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {prepRequirementsComplete.completedCount} of {prepRequirementsComplete.totalCount} complete
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
                <span className="text-xs text-slate-400 dark:text-slate-500">Required Items</span>
                <span className={`text-xs font-medium ${
                  prepRequirementsComplete.allComplete ? 'text-emerald-600' : 'text-corporate-teal-ink'
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
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800' 
                      : 'bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600'
                  }`}
                >
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.complete 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.complete ? '✓' : idx + 1}
                  </div>
                  <span className={`text-sm ${
                    item.complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
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
                <span className="text-corporate-teal-ink font-medium text-sm">
                  Complete all items to unlock additional resources
                </span>
              </div>
            )}
          </div>
        )}

        {/* Facilitator Profile Modal */}
        <FacilitatorProfileModal
          facilitator={selectedTrainer}
          cohortName={cohortData?.name}
          isOpen={showFacilitatorModal}
          onClose={() => {
            setShowFacilitatorModal(false);
            setSelectedTrainer(null);
          }}
        />

        {/* Secret Time Traveler Panel */}
        {showTimeTraveler && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-4 border border-amber-200 dark:border-amber-700 shadow-sm">
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
                  className="w-full px-3 py-2 text-sm border border-amber-200 dark:border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-slate-800 dark:text-white"
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
                    className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-700 transition-colors"
                  >
                    -7d
                  </button>
                  <button
                    onClick={() => handleTimeTravel(-1)}
                    className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-700 transition-colors"
                  >
                    -1d
                  </button>
                  <button
                    onClick={() => handleTimeTravel(1)}
                    className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-700 transition-colors"
                  >
                    +1d
                  </button>
                  <button
                    onClick={() => handleTimeTravel(7)}
                    className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-700 transition-colors"
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
                    className="flex-1 px-3 py-2 text-sm border border-amber-200 dark:border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-slate-800 dark:text-white"
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
