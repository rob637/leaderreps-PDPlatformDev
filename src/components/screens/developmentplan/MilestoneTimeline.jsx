// src/components/developmentplan/MilestoneTimeline.jsx
// Visual timeline showing progress through the 12-week development cycle

import React, { useEffect } from 'react';
// REQ #5: Import Button and ArrowLeft
import { CheckCircle, Circle, Flag, Calendar, ArrowLeft } from 'lucide-react';
import { Card, Badge, Button } from './DevPlanComponents';
import { MILESTONE_CONFIG, getCurrentWeek, getCurrentPhase, COLORS } from './devPlanUtils';

const MilestoneTimeline = ({ plan, onBack }) => {
  const currentWeek = getCurrentWeek(plan);
  const currentPhase = getCurrentPhase(currentWeek);
  
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
    // REQ #5: Improved wrapper div for better layout - FULL WIDTH
    <div className="w-full mx-auto p-4 sm:p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6" style={{ maxWidth: '1400px' }}>
      
      {/* REQ #5: Added Back Button */}
      <div className="mb-0">
        <Button onClick={onBack} variant="nav-back" size="sm">
          <ArrowLeft className="w-4 h-4" /> Back to Tracker
        </Button>
      </div>

      <Card title="12-Week Journey" icon={Calendar} accent="PURPLE">
        {/* Phase Overview */}
        <div className="mb-8 p-3 sm:p-4 lg:p-6 rounded-xl" style={{ background: `${currentPhase.color}10` }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <Badge variant="purple" size="lg">Week {currentWeek} of 12</Badge>
              <h4 className="text-xl sm:text-2xl font-bold mt-3" style={{ color: COLORS.NAVY }}>
                {currentPhase.name} Phase
              </h4>
              <p className="text-base text-gray-600 mt-1">{currentPhase.description}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-5xl font-bold" style={{ color: currentPhase.color }}>
                {Math.round((currentWeek / 12) * 100)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Complete</p>
            </div>
          </div>
        </div>

        {/* Timeline - IMPROVED LAYOUT */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {MILESTONE_CONFIG.phases.map((phase, phaseIdx) => (
            <div key={phase.name} className="relative">
              {/* Phase Header - IMPROVED */}
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ background: phase.color }}
                >
                  {phaseIdx + 1}
                </div>
                <div>
                  <h5 className="font-bold text-lg" style={{ color: COLORS.NAVY }}>
                    {phase.name}
                  </h5>
                  <p className="text-sm text-gray-600">
                    Weeks {phase.weeks[0]}-{phase.weeks[phase.weeks.length - 1]}
                  </p>
                </div>
              </div>

              {/* Week Markers - IMPROVED GRID */}
              <div className="ml-6 pl-6 border-l-2" style={{ borderColor: COLORS.SUBTLE }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {phase.weeks.map(weekNum => {
                    const isPast = weekNum < currentWeek;
                    const isCurrent = weekNum === currentWeek;
                    
                    return (
                      <div 
                        key={weekNum}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isCurrent ? 'ring-2 shadow-lg' : 'shadow-sm'
                        }`}
                        style={{
                          borderColor: isPast || isCurrent ? phase.color : COLORS.SUBTLE,
                          background: isPast ? `${phase.color}10` : isCurrent ? `${phase.color}20` : 'white',
                          ringColor: isCurrent ? phase.color : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isPast ? (
                            <CheckCircle className="w-5 h-5" style={{ color: phase.color }} />
                          ) : isCurrent ? (
                            <Flag className="w-5 h-5" style={{ color: phase.color }} />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                          <span 
                            className={`text-sm font-bold ${
                              isPast || isCurrent ? '' : 'text-gray-400'
                            }`}
                            style={{ color: isPast || isCurrent ? phase.color : undefined }}
                          >
                            Week {weekNum}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Milestones - IMPROVED LAYOUT */}
        <div className="mt-8 p-3 sm:p-4 lg:p-6 rounded-xl border-2 shadow-sm" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
          <h5 className="font-bold text-lg mb-4" style={{ color: COLORS.NAVY }}>
            🎯 Key Milestones
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MilestoneItem 
              week={2}
              label="Foundation Set"
              completed={currentWeek >= 2}
              description="Initial habits established"
            />
            <MilestoneItem 
              week={6}
              label="Practice Groove"
              completed={currentWeek >= 6}
              description="Consistent daily application"
            />
            <MilestoneItem 
              week={8}
              label="Integration Point"
              completed={currentWeek >= 8}
              description="Skills becoming natural"
            />
            <MilestoneItem 
              week={11}
              label="Mastery Level"
              completed={currentWeek >= 11}
              description="Unconscious competence achieved"
            />
            <MilestoneItem 
              week={12}
              label="Progress Scan"
              completed={currentWeek >= 12}
              description="Reassess and plan next cycle"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Helper component for milestone items - IMPROVED
const MilestoneItem = ({ week, label, completed, description }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm">
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          completed ? 'bg-green-100' : 'bg-gray-100'
        }`}
      >
        {completed ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold" style={{ color: COLORS.NAVY }}>
            Week {week}:
          </span>
          <span className={`text-sm font-bold ${completed ? 'text-green-600' : 'text-gray-500'}`}>
            {label}
          </span>
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default MilestoneTimeline;