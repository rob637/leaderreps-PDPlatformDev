import React, { useEffect, useMemo } from 'react';
import { CheckCircle, Circle, Flag, Calendar, ArrowLeft } from 'lucide-react';
import { Card, Badge, Button } from './DevPlanComponents';
import { useDailyPlan } from '../../../hooks/useDailyPlan';

// New 8-Week Config for Daily Plan
const DAILY_PLAN_PHASES = [
  { 
    name: 'Foundation', 
    weeks: [1, 2, 3, 4], 
    color: 'var(--corporate-teal)', 
    description: 'Building core habits and understanding'
  },
  { 
    name: 'Acceleration', 
    weeks: [5, 6, 7, 8], 
    color: 'var(--corporate-orange)', 
    description: 'Expanding skills and consistent practice'
  }
];

const MilestoneTimeline = ({ onBack }) => {
  const { phaseDayNumber, currentPhase } = useDailyPlan();

  // Calculate current week (1-8)
  const currentWeek = useMemo(() => {
    if (currentPhase?.id === 'pre-start') return 0;
    if (currentPhase?.id === 'start') {
      return Math.ceil(phaseDayNumber / 7);
    }
    return 8; // Post-start capped at 8 for this view
  }, [currentPhase, phaseDayNumber]);

  // Determine current phase object
  const currentPhaseObj = useMemo(() => {
    if (currentWeek <= 4) return DAILY_PLAN_PHASES[0];
    return DAILY_PLAN_PHASES[1];
  }, [currentWeek]);

  // Width debugging
  useEffect(() => {
    setTimeout(() => {
      const container = document.querySelector('.w-full.mx-auto');
      if (container) {
        const rect = container.getBoundingClientRect();
        const computed = window.getComputedStyle(container);
        console.log('📐 [MILESTONE TIMELINE] Width Measurements:', {
          component: 'MilestoneTimeline',
          actualWidth: `${rect.width}px`,
          maxWidth: computed.maxWidth,
          padding: computed.padding,
          margin: computed.margin,
          classList: container.className
        });
      }
    }, 100);
  }, []);
  
  return (
    <div className="w-full mx-auto p-4 sm:p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6" style={{ maxWidth: '1400px' }}>
      
      <div className="mb-0">
        <Button onClick={onBack} variant="nav-back" size="sm">
          <ArrowLeft className="w-4 h-4" /> Back to Tracker
        </Button>
      </div>

      <Card title="8-Week Journey" icon={Calendar} accent="PURPLE">
        {/* Phase Overview */}
        <div className="mb-8 p-3 sm:p-4 lg:p-6 rounded-xl" style={{ background: `${currentPhaseObj.color}10` }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <Badge variant="purple" size="lg">Week {Math.max(1, currentWeek)} of 8</Badge>
              <h4 className="text-xl sm:text-2xl font-bold mt-3" style={{ color: 'var(--corporate-navy)' }}>
                {currentPhaseObj.name} Phase
              </h4>
              <p className="text-slate-600 mt-1">
                {currentPhaseObj.description}
              </p>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-3xl font-bold" style={{ color: currentPhaseObj.color }}>
                {Math.round((currentWeek / 8) * 100)}%
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Complete</div>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="relative px-2 sm:px-4 py-8">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 relative">
            {DAILY_PLAN_PHASES.map((phase, phaseIdx) => (
              <div key={phase.name} className="relative">
                {/* Phase Label (Mobile) */}
                <div className="md:hidden mb-4 font-bold text-lg" style={{ color: phase.color }}>
                  {phase.name}
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  {phase.weeks.map((week) => {
                    const isCompleted = week < currentWeek;
                    const isCurrent = week === currentWeek;
                    const isLocked = week > currentWeek;

                    return (
                      <div key={week} className="flex flex-col items-center relative group">
                        {/* Node */}
                        <div 
                          className={`
                            w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300
                            ${isCurrent ? 'scale-110 ring-4 ring-offset-2' : ''}
                            ${isLocked ? 'bg-slate-100 text-slate-400' : ''}
                            ${isCompleted ? 'bg-white text-white' : ''}
                            ${isCurrent ? 'bg-white text-white' : ''}
                          `}
                          style={{
                            backgroundColor: isCompleted || isCurrent ? phase.color : undefined,
                            ringColor: isCurrent ? `${phase.color}40` : undefined
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                          ) : isCurrent ? (
                            <Flag className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                          ) : (
                            <span className="font-bold text-sm">{week}</span>
                          )}
                        </div>

                        {/* Label */}
                        <div className="mt-3 text-center">
                          <div className={`text-xs font-bold ${isCurrent ? 'text-corporate-navy' : 'text-slate-500'}`}>
                            Week {week}
                          </div>
                          {isCurrent && (
                            <div className="text-[10px] font-bold text-corporate-orange uppercase mt-1 animate-pulse">
                              Current
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Phase Label (Desktop) */}
                <div className="hidden md:block text-center mt-8 font-bold text-sm uppercase tracking-wider" style={{ color: phase.color }}>
                  {phase.name} Phase
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MilestoneTimeline;