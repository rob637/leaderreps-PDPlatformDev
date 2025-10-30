// src/components/developmentplan/MilestoneTimeline.jsx
// Visual timeline showing progress through the 12-week development cycle

import React from 'react';
// REQ #5: Import Button and ArrowLeft
import { CheckCircle, Circle, Flag, Calendar, ArrowLeft } from 'lucide-react';
import { Card, Badge, Button } from './DevPlanComponents';
import { MILESTONE_CONFIG, getCurrentWeek, getCurrentPhase, COLORS } from './devPlanUtils';

const MilestoneTimeline = ({ plan, onBack }) => {
  const currentWeek = getCurrentWeek(plan);
  const currentPhase = getCurrentPhase(currentWeek);
  
  return (
    // REQ #5: Added wrapper div for layout
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* REQ #5: Added Back Button */}
      <div className="mb-0">
        <Button onClick={onBack} variant="nav-back" size="sm">
          <ArrowLeft className="w-4 h-4" /> Back to Tracker
        </Button>
      </div>

      <Card title="12-Week Journey" icon={Calendar} accent="PURPLE">
        {/* Phase Overview */}
        <div className="mb-6 p-4 rounded-xl" style={{ background: `${currentPhase.color}10` }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <Badge variant="purple" size="lg">Week {currentWeek} of 12</Badge>
              <h4 className="text-lg font-bold mt-2" style={{ color: COLORS.NAVY }}>
                {currentPhase.name} Phase
              </h4>
              <p className="text-sm text-gray-600">{currentPhase.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: currentPhase.color }}>
                {Math.round((currentWeek / 12) * 100)}%
              </p>
              <p className="text-xs text-gray-600">Complete</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {MILESTONE_CONFIG.phases.map((phase, phaseIdx) => (
            <div key={phase.name} className="relative">
              {/* Phase Header */}
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: phase.color }}
                >
                  {phaseIdx + 1}
                </div>
                <div>
                  <h5 className="font-bold text-sm" style={{ color: COLORS.NAVY }}>
                    {phase.name}
                  </h5>
                  <p className="text-xs text-gray-600">
                    Weeks {phase.weeks[0]}-{phase.weeks[phase.weeks.length - 1]}
                  </p>
                </div>
              </div>

              {/* Week Markers */}
              <div className="ml-4 pl-4 border-l-2" style={{ borderColor: COLORS.SUBTLE }}>
                <div className="grid grid-cols-4 gap-2">
                  {phase.weeks.map(weekNum => {
                    const isPast = weekNum < currentWeek;
                    const isCurrent = weekNum === currentWeek;
                    const isFuture = weekNum > currentWeek;
                    
                    return (
                      <div 
                        key={weekNum}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          isCurrent ? 'ring-2' : ''
                        }`}
                        style={{
                          borderColor: isPast || isCurrent ? phase.color : COLORS.SUBTLE,
                          background: isPast ? `${phase.color}10` : isCurrent ? `${phase.color}20` : 'white',
                          ringColor: isCurrent ? phase.color : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {isPast ? (
                            <CheckCircle className="w-4 h-4" style={{ color: phase.color }} />
                          ) : isCurrent ? (
                            <Flag className="w-4 h-4" style={{ color: phase.color }} />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                          <span 
                            className={`text-xs font-semibold ${
                              isPast || isCurrent ? '' : 'text-gray-400'
                            }`}
                            style={{ color: isPast || isCurrent ? phase.color : undefined }}
                          >
                            W{weekNum}
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

        {/* Key Milestones */}
        <div className="mt-6 p-4 rounded-xl border-2" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
          <h5 className="font-bold text-sm mb-3" style={{ color: COLORS.NAVY }}>
            Key Milestones
          </h5>
          <div className="space-y-2">
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

// Helper component for milestone items
const MilestoneItem = ({ week, label, completed, description }) => {
  return (
    <div className="flex items-center gap-3">
      <div 
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          completed ? 'bg-green-100' : 'bg-gray-100'
        }`}
      >
        {completed ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Circle className="w-4 h-4 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: COLORS.NAVY }}>
            Week {week}:
          </span>
          <span className={`text-xs font-semibold ${completed ? 'text-green-600' : 'text-gray-500'}`}>
            {label}
          </span>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default MilestoneTimeline;